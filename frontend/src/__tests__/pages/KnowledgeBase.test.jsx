import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('KnowledgeBase document preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    documentsApi.getDocuments.mockResolvedValue([documentItem]);
  });

  it('открывает документ в режиме чтения', async () => {
    render(<KnowledgeBase />);
    const title = await screen.findByRole('heading', { name: documentItem.title });

    fireEvent.click(title);

    expect(screen.getByRole('dialog', { name: documentItem.title })).toBeInTheDocument();
    expect(screen.getByText(documentItem.content_text)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /редактировать/i })).toBeInTheDocument();
    expect(screen.queryByDisplayValue(documentItem.title)).not.toBeInTheDocument();
  });

  it('переходит к редактированию только по отдельной кнопке', async () => {
    render(<KnowledgeBase />);
    fireEvent.click(await screen.findByRole('heading', { name: documentItem.title }));
    fireEvent.click(screen.getByRole('button', { name: /редактировать/i }));

    await waitFor(() => expect(screen.getByDisplayValue(documentItem.title)).toBeInTheDocument());
    expect(screen.queryByRole('dialog', { name: documentItem.title })).not.toBeInTheDocument();
  });
});
