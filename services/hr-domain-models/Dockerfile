FROM python:3.11-slim AS base

WORKDIR /app

COPY . /app/hr-domain-models

RUN pip install --upgrade pip && pip install -e /app/hr-domain-models