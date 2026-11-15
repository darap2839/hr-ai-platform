"""Regression tests for ownership isolation and trustworthy evidence reporting."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('diagnostics', Path(__file__).parents[1] / 'functional-diagnostics.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
Runner = module.Runner


class DiagnosticsSafetyTests(unittest.TestCase):
    def test_foreign_record_and_notification_are_never_modified(self):
        calls = []
        def request(method, path, payload=None, **kwargs):
            calls.append((method, path))
            if path.startswith('/api/notifications'):
                return 200, [{'id': 'foreign', 'entity_type': 'vacancy', 'entity_id': 99}], {}
            return 200, {'id': 1, 'title': 'Real vacancy'}, {}
        runner = Runner('http://nginx', request)
        runner.owned = [('vacancies', 1)]
        runner.cleanup()
        self.assertTrue(all(method == 'GET' for method, _ in calls))
        self.assertTrue(any(c['status'] == 'failed' and 'Ownership mismatch' in c['detail'] for c in runner.checks))

    def test_ambiguous_create_is_reported_and_never_guessed_for_deletion(self):
        calls = []
        def request(method, path, payload=None, **kwargs):
            calls.append((method, path))
            return (500, {'detail': 'PRIVATE_BODY'}, {}) if method == 'POST' else (200, [], {})
        runner = Runner('http://nginx', request)
        self.assertIsNone(runner.create('CAN-CREATE', 'candidates', {'full_name': runner.marker}))
        runner.cleanup()
        self.assertTrue(any(c['id'] == 'CLEANUP-UNCERTAIN' for c in runner.checks))
        self.assertFalse(any(m == 'DELETE' for m, _ in calls))
        self.assertNotIn('PRIVATE_BODY', str(runner.report('functional')))

    def test_unexpected_success_on_invalid_create_is_owned_for_cleanup(self):
        def request(method, path, payload=None, **kwargs):
            return 200, {'id': 42, 'title': 'Synthetic'}, {}
        runner = Runner('http://nginx', request)
        self.assertIsNone(runner.check('VAC-INVALID', 'POST', '/api/vacancies', {}, expect=(400, 422)))
        self.assertEqual(runner.owned, [('vacancies', 42)])
        self.assertEqual(runner.checks[-1]['status'], 'failed')

    def test_already_soft_deleted_document_is_owned_and_removed(self):
        calls = []
        def request(method, path, payload=None, **kwargs):
            calls.append((method, path))
            if '?deleted=true' in path:
                return 200, [{'id': 4, 'title': runner.marker, 'is_deleted': True}], {}
            if method == 'DELETE':
                return 200, {'status': 'permanently_deleted'}, {}
            if 'notifications' in path:
                return 200, [], {}
            return 404, {}, {}
        runner = Runner('http://nginx', request)
        runner.owned = [('documents', 4)]
        runner.cleanup()
        self.assertIn(('DELETE', '/api/documents/4/permanent'), calls)
        self.assertNotIn(('DELETE', '/api/documents/4'), calls)

    def test_outage_requires_503_not_502_or_generic_health_failure(self):
        def request(method, path, payload=None, **kwargs):
            if path == '/health': return 200, {'status': 'ok'}, {}
            if path.endswith('/0'): return 404, {}, {}
            return 502, {'detail': 'PRIVATE'}, {}
        runner = Runner('http://nginx', request)
        runner.ai('outage')
        self.assertEqual(runner.checks[-1]['status'], 'failed')
        self.assertNotIn('PRIVATE', str(runner.report('outage')))

    def test_rejects_nonlocal_destination(self):
        with self.assertRaises(ValueError): Runner('https://example.com')

    def test_transport_failure_does_not_expose_exception_text(self):
        def request(*args, **kwargs): raise RuntimeError('token=PRIVATE')
        runner = Runner('http://nginx', request)
        runner.check('HTTP', 'GET', '/health')
        self.assertEqual(runner.checks[0]['status'], 'blocked')
        self.assertNotIn('PRIVATE', str(runner.report('functional')))


if __name__ == '__main__': unittest.main()
