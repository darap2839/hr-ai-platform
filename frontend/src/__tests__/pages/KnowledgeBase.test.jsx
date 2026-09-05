import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KnowledgeBase from '../../pages/KnowledgeBase';
import { documentsApi } from '../../api/client';

vi.mock('../../api/client', () => ({
  documentsApi: {
    getDocuments: vi.fn(),
    uploadDocument: vi.fn()
  }
}));

describe('KnowledgeBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    documentsApi.getDocuments.mockResolvedValue([]);
  });

  it('показывает отдельные действия создания страницы и загрузки файла', async () => {
    render(<KnowledgeBase />);

    expect(screen.getByRole('button', { name: /создать страницу/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /загрузить файл/i })).toBeInTheDocument();
    await waitFor(() => expect(documentsApi.getDocuments).toHaveBeenCalled());
  });

  it('создаёт внутреннюю страницу без файла как черновик', async () => {
    documentsApi.uploadDocument.mockResolvedValue({ id: 42 });
    render(<KnowledgeBase />);

    fireEvent.click(screen.getByRole('button', { name: /создать страницу/i }));
    fireEvent.change(screen.getByLabelText(/название/i), {
      target: { value: 'Регламент интервью' }
    });
    fireEvent.change(screen.getByLabelText(/содержание/i), {
      target: { value: 'Порядок подготовки и проведения интервью.' }
    });
    fireEvent.click(screen.getByRole('button', { name: /сохранить черновик/i }));

    await waitFor(() => expect(documentsApi.uploadDocument).toHaveBeenCalledTimes(1));
    const payload = documentsApi.uploadDocument.mock.calls[0][0];
    expect(payload.get('title')).toBe('Регламент интервью');
    expect(payload.get('content_text')).toBe('Порядок подготовки и проведения интервью.');
    expect(payload.get('file')).toBeNull();
  });
});
