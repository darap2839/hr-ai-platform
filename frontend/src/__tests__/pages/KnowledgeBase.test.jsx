import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import KnowledgeBase from '../../pages/KnowledgeBase';
import { documentsApi } from '../../api/client';

vi.mock('../../api/client', () => ({
  documentsApi: {
    getDocuments: vi.fn(),
    getDocumentFile: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn()
  }
}));

const documentItem = {
  id: 1,
  title: 'Регламент интервью',
  description: 'Порядок проведения интервью',
  content_text: 'Подготовьте вопросы до встречи.',
  doc_type: 'procedure',
  department: 'HR',
  status: 'published',
  file_name: 'interview.pdf',
  created_at: '2026-09-05T10:00:00Z'
};

const renderKnowledgeBase = (initialEntry = '/knowledge-base') => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <KnowledgeBase />
  </MemoryRouter>
);

describe('KnowledgeBase document preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    documentsApi.getDocuments.mockResolvedValue([documentItem]);
  });

  it('открывает документ в режиме чтения', async () => {
    renderKnowledgeBase();
    const title = await screen.findByRole('heading', { name: documentItem.title });

    fireEvent.click(title);

    expect(screen.getByRole('dialog', { name: documentItem.title })).toBeInTheDocument();
    expect(screen.getByText(documentItem.content_text)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /редактировать/i })).toBeInTheDocument();
    expect(screen.queryByDisplayValue(documentItem.title)).not.toBeInTheDocument();
  });

  it('переходит к редактированию только по отдельной кнопке', async () => {
    renderKnowledgeBase();
    fireEvent.click(await screen.findByRole('heading', { name: documentItem.title }));
    fireEvent.click(screen.getByRole('button', { name: /редактировать/i }));

    await waitFor(() => expect(screen.getByDisplayValue(documentItem.title)).toBeInTheDocument());
    expect(screen.queryByRole('dialog', { name: documentItem.title })).not.toBeInTheDocument();
  });

  it('восстанавливает фильтры из URL', async () => {
    renderKnowledgeBase('/knowledge-base?type=procedure&department=HR');

    expect(screen.getByLabelText('Тип документа')).toHaveValue('procedure');
    expect(screen.getByLabelText('Отдел')).toHaveValue('HR');
    await waitFor(() => expect(documentsApi.getDocuments).toHaveBeenCalled());
    const params = documentsApi.getDocuments.mock.calls.at(-1)[0];
    expect(params.get('doc_type')).toBe('procedure');
    expect(params.get('department')).toBe('HR');
  });

  it('отправляет поиск только после задержки', async () => {
    vi.useFakeTimers();
    renderKnowledgeBase();
    await act(async () => {});
    const initialCalls = documentsApi.getDocuments.mock.calls.length;

    fireEvent.change(screen.getByLabelText('Поиск по документам'), {
      target: { value: 'отпуск' }
    });
    expect(documentsApi.getDocuments).toHaveBeenCalledTimes(initialCalls);

    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    expect(documentsApi.getDocuments).toHaveBeenCalledTimes(initialCalls + 1);
    expect(documentsApi.getDocuments.mock.calls.at(-1)[0].get('search')).toBe('отпуск');
    vi.useRealTimers();
  });
});
