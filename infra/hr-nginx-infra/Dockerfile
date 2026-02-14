FROM nginx:stable

#RUN echo "deb http://deb.debian.org/debian bookworm main" > /etc/apt/sources.list && \
#    echo "deb http://deb.debian.org/debian-security bookworm-security main" >> /etc/apt/sources.list && \
#    echo "deb http://deb.debian.org/debian bookworm-updates main" >> /etc/apt/sources.list && \
#    apt-get update && \
#    apt-get install -y --no-install-recommends gettext-base openssl && \
#    rm -rf /var/lib/apt/lists/*

ENV DOMAIN_NAME=localhost
ENV SSL=false

COPY entrypoint.sh /docker-entrypoint.sh

COPY common-proxy.conf /etc/nginx/common-proxy.conf

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]