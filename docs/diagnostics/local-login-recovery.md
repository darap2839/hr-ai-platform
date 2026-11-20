# Локальный вход через 127.0.0.1:18080

После выхода браузер обращается к реальному authorization endpoint. Ранее
публичная конфигурация указывала http://localhost/auth, хотя доступ к приложению
на порту 80 давал тайм-аут. Поэтому рабочий health на 18080 не доказывал
доступность нового входа через 80.

Для диагностического стенда зафиксировать один origin:
http://127.0.0.1:18080. Публичный адрес Keycloak — /auth на том же origin.

Локальный Compose override должен сохранять:

```yaml
services:
  backend:
    environment:
      KEYCLOAK_URL: http://127.0.0.1:18080/auth
      KEYCLOAK_ISSUER: http://127.0.0.1:18080/auth/realms/platform
  keycloak:
    environment:
      KC_HOSTNAME: http://127.0.0.1:18080/auth
  nginx:
    ports:
      - "127.0.0.1:18080:80"
```

Дополнительно в реальном файле фиксируются уже проверенный backend-образ
5e192b1 и опубликованный frontend-образ с восстановленным демо-профилем.
Этот override использовать вместе с базовым docker-compose.yml и сохранять
при последующих up. Не включать down -v или очистку data.

nginx передаёт нормализованный host вместе с внешним портом, извлечённым из
HTTP Host; X-Forwarded-Port больше не подменяется внутренним портом 80.
KC_HOSTNAME содержит полный публичный URL, чтобы issuer и ссылки Keycloak
не зависели от внутренних имён контейнеров. Backend получает ключи по
внутреннему адресу, но проверяет подпись и внешний issuer.

После обновления и перезапуска Keycloak/backend/frontend, перечитать nginx.
Проверить одновременно:

1. /api/auth/keycloak-config.url == http://127.0.0.1:18080/auth.
2. /auth/realms/platform/.well-known/openid-configuration.issuer ==
   http://127.0.0.1:18080/auth/realms/platform.
3. Новый вход возвращает на 127.0.0.1:18080; кадровые разделы загружаются.
4. Анонимный /api/candidates продолжает возвращать 401.
5. В интерфейсе отображаются «Дарья Попова», depopova, HR business partner
   по явному требованию владельца; подписанный sub/username не подменяются.

После смены origin провайдера требуется новый вход. Старые токены со старым
issuer намеренно не принимаются. Ctrl+F5 сбрасывает загруженную конфигурацию
frontend; сессия Keycloak и текущие пользователи в БД не удаляются.

Источники конфигурации:
https://www.keycloak.org/server/hostname
https://www.keycloak.org/server/reverseproxy
