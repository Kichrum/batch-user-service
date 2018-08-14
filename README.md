# Batch Editing service

This is an application to support the option to perform batch actions on our existing
services. This will allow us to create / update / delete multiple resources at once.
Since we want that functionality in all of our services, instead of updating all of them, adding
batch support, we wanted to create one new microservice - the Batch Editing service.
This new service will manage the batch job running of any other service in the system.

### Install
```
git clone git@github.com:Kichrum/batch-user-service.git
cd batch-user-service
yarn install
yarn start
```

Then you can use Postman to preform requests. Use the following Postman params:
- URL: POST http://localhost:3005/batch
- Headers: Content-Type: application/json
- Body: raw, JSON


If you don't have free port 3005, then use the following syntax to use another port, for example, 80:

`PORT=80 yarn start`

### Example request:

POST /batch

```
{
  "endpoint": {
    "url": "https://user-service.com/user/{userId}",
    "verb": "PUT"
  },
  "payload": [
    {
      "userId": 14,
      "requestBody": {
        "age": 30
      }
    },
    {
      "userId": 29,
      "requestBody": {
        "age": 30
      }
    },
    {
      "userId": 103,
      "requestBody": {
        "age": 30
      }
    }
  ]
}


```


### Example response:

```
{
    "success": true,
    "payload": [
        {
            "success": true
        },
        {
            "success": false
        },
        {
            "success": true
        }
    ]
}
```
