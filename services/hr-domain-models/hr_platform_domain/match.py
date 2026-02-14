class Match:
    def __init__(self, candidate_id: int, job_id: int, score: float, gap: list[str]):
        self.candidate_id = candidate_id
        self.job_id = job_id
        self.score = score
        self.gap = gap
