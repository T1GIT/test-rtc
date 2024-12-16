# Use a base image with the tools we need for building
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y \
    coturn \
    git

CMD ["turnserver", "--log-file", "stdout"]

EXPOSE 3478
EXPOSE 3478/udp
