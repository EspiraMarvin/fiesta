##### Features:

1. Asynchronous logging - env level logging (local, dev, and prod), daily, combined and error logs
   (with async logs, logs are first sent to a lock-free buffer and control is immediately returned. The buffer contents are then flushed periodically to disk, significantly reducing I/O overhead.)
2. rate limiting - general app limiter and specific endpoint limiter(auth endpoint)
3. offset-based pagination
4. Redis for caching
5. api health endpoint - with status and uptime length
6. docker image builder for dev and prod env
7. Implements tests

https://www.linkedin.com/posts/sahnlam_systemdesign-coding-interviewtips-activity-7359071811591921665-ZVCL?utm_source=share&utm_medium=member_desktop&rcm=ACoAACTkTv4BSdAmdmkWC4WbGsuDaELTQUdG6wE

##### Run server

> npm run dev

##### Using docker compose

###### build and run

> docker-compose up

###### if already built once

> docker-compose up

##### Using docker

> docker run -p 4000:4000 --env-file .env fiest
