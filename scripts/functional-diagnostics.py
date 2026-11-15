"""Bounded API diagnostics using only run-owned synthetic records; JSON evidence only."""
import argparse
import json
import time
import uuid
import urllib.error
import urllib.parse
import urllib.request


class Runner:
    """Exercise real HTTP endpoints while retaining an ownership ledger for cleanup."""

    def __init__(self, base_url, request=None):
        self.base_url = base_url.rstrip('/')
        host = urllib.parse.urlsplit(self.base_url).hostname
        if host not in {'nginx', 'localhost', '127.0.0.1', '::1'}:
            raise ValueError('Only the project nginx service or loopback is allowed')
        self.marker = 'HRDIAG-' + uuid.uuid4().hex
        self.checks = []
        self.owned = []
        self.uncertain_writes = []
        self.request = request or self.http

    def http(self, method, path, payload=None, raw=None, content_type=None, timeout=20):
        """Return status, parsed response, headers; never persist raw response bodies."""
        body = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)
        headers = {'Content-Type': content_type or 'application/json'} if body is not None else {}
        req = urllib.request.Request(self.base_url + path, data=body, method=method, headers=headers)
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            response = opener.open(req, timeout=timeout)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            content = response.read(2 * 1024 * 1024 + 1)
            if len(content) > 2 * 1024 * 1024:
                raise ValueError('Response size limit exceeded')
            try:
                value = json.loads(content)
            except (ValueError, UnicodeDecodeError):
                value = content
            return response.code, value, dict(response.headers)

    def record(self, ident, status, detail):
        self.checks.append({'id': ident, 'status': status, 'detail': detail})

    def check(self, ident, method, path, payload=None, expect=(200,), verify=None, **kwargs):
        """Record the expected status and semantic assertion, including HTTP failures."""
        started = time.monotonic()
        try:
            code, value, headers = self.request(method, path, payload, **kwargs)
            if method == 'POST' and path in ('/api/vacancies', '/api/candidates', '/api/documents'):
                kind = path.split('/')[-1]
                if isinstance(value, dict) and type(value.get('id')) is int and value['id'] > 0:
                    self.owned.append((kind, value['id']))
                elif code >= 500 or 200 <= code < 300:
                    self.uncertain_writes.append(kind)
            good = code in expect and (verify is None or bool(verify(value, headers)))
            self.record(ident, 'passed' if good else 'failed',
                        'expected HTTP %s; actual HTTP %s; assertion=%s; %.3fs' %
                        ('/'.join(map(str, expect)), code, good, time.monotonic() - started))
            return value if good else None
        except Exception as error:
            self.record(ident, 'blocked', type(error).__name__)
            return None

    def create(self, ident, kind, payload=None, **kwargs):
        """Remember IDs before other assertions; flag writes with ambiguous results."""
        path = '/api/' + kind
        try:
            code, value, _ = self.request('POST', path, payload, **kwargs)
            if isinstance(value, dict) and type(value.get('id')) is int and value['id'] > 0:
                self.owned.append((kind, value['id']))
            else:
                if code >= 500 or 200 <= code < 300:
                    self.uncertain_writes.append(kind)
            good = code in (200, 201) and isinstance(value, dict) and type(value.get('id')) is int and value['id'] > 0
            self.record(ident, 'passed' if good else 'failed', 'expected HTTP 200/201 and positive id; actual HTTP %s' % code)
            return value if good else None
        except Exception as error:
            self.uncertain_writes.append(kind)
            self.record(ident, 'blocked', type(error).__name__)
            return None

    def multipart(self, fields, text):
        """Build a tiny synthetic TXT upload without optional Python packages."""
        boundary = 'hrdiag' + uuid.uuid4().hex
        parts = []
        for key, value in fields.items():
            parts.append(('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n' % (boundary, key, value)).encode())
        parts.append(('--%s\r\nContent-Disposition: form-data; name="file"; filename="%s.txt"\r\nContent-Type: text/plain\r\n\r\n%s\r\n' % (boundary, self.marker, text)).encode())
        parts.append(('--%s--\r\n' % boundary).encode())
        return b''.join(parts), 'multipart/form-data; boundary=' + boundary

    def functional(self):
        """Probe CRUD, file roundtrip, baseline matching and unauthenticated access."""
        vacancy_payload = {'title': self.marker, 'department': 'Diagnostic lab',
                           'description': 'Synthetic PCB engineer fixture',
                           'required_skills': ['PCB'], 'salary_from': 20000, 'salary_to': 35000}
        try:
            self.check('VAC-INVALID-SALARY', 'POST', '/api/vacancies',
                       dict(vacancy_payload, salary_from=40000), expect=(400, 422))
            vacancy = self.create('VAC-CREATE', 'vacancies', vacancy_payload)
            candidate = self.create('CAN-CREATE', 'candidates',
                                    {'full_name': self.marker, 'email': self.marker.lower() + '@example.com',
                                     'skills': ['PCB'], 'experience_years': 3,
                                     'resume_text': 'Synthetic PCB design experience. No real person.'})
            if vacancy:
                vid = vacancy['id']
                self.check('VAC-READ', 'GET', '/api/vacancies/%s' % vid,
                           verify=lambda v, h: v.get('title') == self.marker)
                self.check('VAC-UPDATE', 'PUT', '/api/vacancies/%s' % vid,
                           dict(vacancy_payload, description='Updated synthetic fixture'),
                           verify=lambda v, h: v.get('description') == 'Updated synthetic fixture')
                self.check('VAC-CLOSE', 'PATCH', '/api/vacancies/%s/close' % vid,
                           verify=lambda v, h: v.get('status') == 'closed')
                self.check('VAC-REOPEN', 'PATCH', '/api/vacancies/%s/reopen' % vid,
                           verify=lambda v, h: v.get('status') == 'open')
                self.check('AUTH-VAC-NO-TOKEN', 'GET', '/api/vacancies/%s' % vid, expect=(401, 403))
            if candidate:
                cid = candidate['id']
                self.check('CAN-READ', 'GET', '/api/candidates/%s' % cid,
                           verify=lambda v, h: v.get('full_name') == self.marker)
                self.check('CAN-UPDATE', 'PUT', '/api/candidates/%s' % cid,
                           {'experience_years': 4}, verify=lambda v, h: v.get('experience_years') == 4)
                self.check('AUTH-CAN-NO-TOKEN', 'GET', '/api/candidates/%s' % cid, expect=(401, 403))
            if vacancy and candidate:
                application = self.create('APP-CREATE', 'applications',
                                          {'candidate_id': candidate['id'], 'vacancy_id': vacancy['id']})
                if application:
                    aid = application['id']
                    self.check('APP-ANALYZE', 'POST', '/api/applications/%s/analyze' % aid,
                               verify=lambda v, h: isinstance(v.get('ai_analysis'), dict) and v['ai_analysis'].get('score') == 100)
                    self.check('APP-STAGE', 'PATCH', '/api/applications/%s/stage' % aid,
                               {'stage': 'screening'}, verify=lambda v, h: v.get('stage') == 'screening')
                    self.check('APP-QUESTIONS', 'GET', '/api/applications/%s/interview-questions' % aid,
                               verify=lambda v, h: bool(v.get('questions')))
                self.record('APP-SEMANTIC-QUALITY', 'blocked', 'A 100 score on identical PCB strings does not validate semantic ranking.')
            text = 'Synthetic document ' + self.marker
            body, content_type = self.multipart({'title': self.marker, 'department': 'Diagnostic lab'}, text)
            self.check('DOC-PREVIEW', 'POST', '/api/documents/preview', raw=body, content_type=content_type,
                       verify=lambda v, h: v.get('content_text', '').strip() == text)
            document = self.create('DOC-UPLOAD', 'documents', raw=body, content_type=content_type)
            if document:
                did = document['id']
                self.check('DOC-ROUNDTRIP', 'GET', '/api/documents/%s/file' % did,
                           verify=lambda v, h: v == text.encode())
                self.check('AUTH-DOC-NO-TOKEN', 'GET', '/api/documents/%s' % did, expect=(401, 403))
                self.check('DOC-UPDATE', 'PUT', '/api/documents/%s' % did,
                           {'description': 'Synthetic revision'}, verify=lambda v, h: v.get('description') == 'Synthetic revision')
                self.check('DOC-VERSION', 'GET', '/api/documents/%s/versions' % did,
                           verify=lambda v, h: isinstance(v, list) and len(v) >= 1)
                self.check('DOC-SOFT-DELETE', 'DELETE', '/api/documents/%s' % did)
                self.check('DOC-HIDDEN', 'GET', '/api/documents/%s' % did, expect=(404,))
                self.check('DOC-RESTORE', 'POST', '/api/documents/%s/restore' % did,
                           verify=lambda v, h: v.get('is_deleted') is False)
            self.check('ORG-TREE-READ', 'GET', '/api/organization/units',
                       verify=lambda v, h: isinstance(v, list))
            self.record('AUTH-BROWSER-SESSION', 'blocked', 'Browser login, token renewal and logout require separate verification; no credentials collected.')
            self.record('RAG-SEARCH-QUALITY', 'blocked', 'No labelled relevance dataset or resume index was validated.')
            self.record('NOT-SSE-DELIVERY', 'blocked', 'SSE browser delivery is not covered by this API runner.')
        finally:
            self.cleanup()

    def cleanup(self):
        """Delete only objects whose live identity still matches this run's marker."""
        for kind, ident in reversed(self.owned):
            if kind == 'applications':
                continue  # No DELETE endpoint: removed by test candidate/vacancy cascade.
            path = '/api/%s/%s' % (kind, ident)
            try:
                code, value, _ = self.request('GET', path)
                if kind == 'documents' and code == 404:
                    list_code, items, _ = self.request('GET', '/api/documents?deleted=true&search=' + self.marker)
                    if list_code == 200 and isinstance(items, list):
                        value = next((item for item in items if item.get('id') == ident), None)
                        code = 200 if value is not None else 404
                if code != 200 or not isinstance(value, dict):
                    self.record('CLEANUP-' + kind, 'blocked', 'Ownership cannot be reverified; retained test id %s' % ident)
                    continue
                field = 'full_name' if kind == 'candidates' else 'title'
                if value.get(field) != self.marker:
                    self.record('CLEANUP-' + kind, 'failed', 'Ownership mismatch; object not deleted.')
                    continue
                if kind == 'documents':
                    if not value.get('is_deleted'):
                        deleted = self.check('CLEANUP-DOC-SOFT', 'DELETE', path)
                        if deleted is None:
                            continue
                    self.check('CLEANUP-DOC-PERMANENT', 'DELETE', path + '/permanent')
                else:
                    self.check('CLEANUP-' + kind, 'DELETE', path)
                self.check('CLEANUP-ABSENT-' + kind, 'GET', path, expect=(404,))
            except Exception as error:
                self.record('CLEANUP-' + kind, 'blocked', type(error).__name__)
        application_ids = {ident for kind, ident in self.owned if kind == 'applications'}
        if application_ids:
            self.check('CLEANUP-APPLICATION-CASCADE', 'GET', '/api/applications',
                       verify=lambda v, h: isinstance(v, list) and not any(a.get('id') in application_ids for a in v))
        # Never clear all notifications. Delete only notifications tied to our known IDs.
        try:
            code, notices, _ = self.request('GET', '/api/notifications?limit=1000')
            singular = {'vacancies': 'vacancy', 'candidates': 'candidate', 'applications': 'application', 'documents': 'document'}
            owned_entities = {(singular[kind], ident) for kind, ident in self.owned}
            owned_notices = [n for n in notices if (n.get('entity_type'), n.get('entity_id')) in owned_entities] if code == 200 and isinstance(notices, list) else []
            if any(k == 'applications' for k, _ in self.owned):
                self.record('NOT-CREATE', 'passed' if owned_notices else 'failed', 'Notifications linked to this run found=%s' % len(owned_notices))
            if code == 200 and isinstance(notices, list):
                for notice in notices:
                    if (notice.get('entity_type'), notice.get('entity_id')) in owned_entities and isinstance(notice.get('id'), str):
                        self.check('NOT-OWNED-READ', 'POST', '/api/notifications/%s/read' % urllib.parse.quote(notice['id'], safe=''))
                        self.check('CLEANUP-NOT', 'DELETE', '/api/notifications/%s' % urllib.parse.quote(notice['id'], safe=''))
        except Exception as error:
            self.record('CLEANUP-NOT', 'blocked', type(error).__name__)
        if self.uncertain_writes:
            self.record('CLEANUP-UNCERTAIN', 'blocked', 'A failed write may have persisted a synthetic record; inspect only prefix ' + self.marker)

    def ai(self, phase):
        """Check a real stopped-engine boundary or bounded post-restart readiness."""
        if phase == 'recovery':
            deadline = time.monotonic() + 120
            while True:
                try:
                    status, _, _ = self.request('GET', '/health', timeout=5)
                    # Real readiness is checked separately via the engine health URL.
                    req = urllib.request.Request('http://ai-engine:8000/health')
                    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
                    with opener.open(req, timeout=5) as response:
                        if status == 200 and response.code == 200:
                            break
                except Exception:
                    pass
                if time.monotonic() >= deadline:
                    self.record('AI-RECOVERY-READY', 'blocked', '120s readiness deadline exceeded.')
                    return
                time.sleep(2)
        self.check('SYS-HEALTH-' + phase, 'GET', '/health', verify=lambda v, h: v.get('status') == 'ok')
        if phase == 'outage':
            self.check('VAC-DB-WHILE-AI-DOWN', 'GET', '/api/vacancies/0', expect=(404,))
        self.check('AI-' + phase.upper(), 'POST', '/api/ai/chat',
                   {'messages': [{'role': 'user', 'content': 'Reply OK.'}], 'max_tokens': 16},
                   expect=(503,) if phase == 'outage' else (200,), timeout=135,
                   verify=(lambda v, h: bool(v.get('choices', [{}])[0].get('message', {}).get('content'))) if phase != 'outage' else None)

    def report(self, phase):
        return {'schemaVersion': 1, 'phase': phase, 'marker': self.marker,
                'checks': self.checks, 'ownedTestIds': [{'type': k, 'id': i} for k, i in self.owned],
                'scope': 'Synthetic API checks; no raw bodies, tokens or real personnel data stored.'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://nginx')
    parser.add_argument('--phase', choices=['functional', 'outage', 'recovery'], default='functional')
    args = parser.parse_args()
    runner = Runner(args.base_url)
    try:
        if args.phase == 'functional':
            runner.functional()
        else:
            runner.ai(args.phase)
    except Exception as error:
        runner.record('RUNNER', 'blocked', type(error).__name__)
    print(json.dumps(runner.report(args.phase)))


if __name__ == '__main__':
    main()
