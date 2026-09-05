import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KnowledgeDocumentDetail from '../../pages/KnowledgeDocumentDetail';
import { documentsApi } from '../../api/client';

vi.mock('../../api/client', () => ({
  documentsApi: {
    getDocument: vi.fn(),
    getDocumentFile: vi.fn(),
    updateDocument: vi.fn()
  }
}));

const documentItem = {
  id: 7,
  title: 'Регламент интервью',
  description: 'Порядок проведения интервью',
  content_text: 'Подготовьте вопросы до встречи.',
  doc_type: 'procedure',
  department: 'HR',
  status: 'published',
  file_name: 'interview.pdf',
  created_at: '2026-09-05T10:00:00Z'
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/knowledge-base/documents/7']}>
    <Routes>
      <Route path="/knowledge-base/documents/:id" element={<KnowledgeDocumentDetail />} />
    </Routes>
  </MemoryRouter>
);

describe('KnowledgeDocumentDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    documentsApi.getDocument.mockResolvedValue(documentItem);
  });

  it('показывает документ на отдельной странице в режиме чтения', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: documentItem.title })).toBeInTheDocument();
    expect(screen.getByText(documentItem.content_text)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(documentItem.title)).not.toBeInTheDocument();
  });

  it('включает редактирование только по отдельной кнопке', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /редактировать/i }));

    await waitFor(() => expect(screen.getByDisplayValue(documentItem.title)).toBeInTheDocument());
  });
});
