##### Features:

1. logging - env level logging (local, dev, and prod), daily, combined and error logs
2. rate limiting - general app limiter and specific endpoint limiter(auth endpoint)
3. offset-based pagination
4. docker image builder for dev and prod env

##### Run server

> npm run dev

##### Using docker compose

###### build and run

> docker-compose up

###### if already built once

> docker-compose up

##### Using docker

> docker run -p 4000:4000 --env-file .env fiest
