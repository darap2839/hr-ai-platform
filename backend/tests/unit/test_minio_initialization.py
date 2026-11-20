"""Object storage initialization must not prevent offline test collection."""
import subprocess
import sys
from unittest.mock import Mock, patch

import pytest
from minio.error import S3Error

from app.services.minio_service import MinioService


def test_import_does_not_contact_storage():
    source = "from unittest.mock import patch\nwith patch('minio.Minio.bucket_exists', side_effect=AssertionError('network on import')):\n import app.services.minio_service\n"
    result = subprocess.run([sys.executable, '-c', source], capture_output=True, text=True, timeout=15)
    assert result.returncode == 0, result.stderr


@pytest.fixture
def storage():
    service = MinioService()
    with patch.object(service, 'client', Mock()) as client:
        yield service, client


def test_upload_creates_missing_bucket_before_writing(storage):
    service, client = storage
    client.bucket_exists.return_value = False
    result = service.upload_file(b'content', 'test.txt', 'text/plain')
    assert result.startswith('documents/')
    assert [call[0] for call in client.method_calls] == ['bucket_exists', 'make_bucket', 'put_object']


def test_upload_does_not_recreate_existing_bucket(storage):
    service, client = storage
    client.bucket_exists.return_value = True
    assert service.upload_file(b'content', 'test.txt')
    client.make_bucket.assert_not_called()


def test_failed_bucket_creation_does_not_upload(storage):
    service, client = storage
    client.bucket_exists.side_effect = S3Error('AccessDenied', 'denied', 'bucket', 'req', 'host', None)
    assert service.upload_file(b'content', 'test.txt') is None
    client.put_object.assert_not_called()
