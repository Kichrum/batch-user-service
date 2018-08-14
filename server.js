const app = require('express')(),
    bodyParser = require('body-parser'),
    axios = require('axios');

app.use(bodyParser.json());
app.listen(process.env.PORT || 3005, () => console.log('Server is up and running'));

const prepareUrl = (url, userId) => {
    if (url.includes('{userId}')) {
        return url.replace('{userId}', userId);
    }
    return url;
};

const prepareServiceRequests = (item, endpoint) => {
    return {
        method: endpoint.verb,
        url: prepareUrl(endpoint.url, item.userId),
        body: item.requestBody
    };
};

const makeServiceRequests = requests => {
    return requests.map(item => axios(item)
        .catch(() => axios(item))
        .then(() => ({success: true}))
        .catch(() => ({success: false}))
    );
};

app.post('/batch', (request, response) => {
    const serviceRequestsParams = request.body.payload.map(item => prepareServiceRequests(item, request.body.endpoint)),
        serviceRequests = makeServiceRequests(serviceRequestsParams);
    Promise.all(serviceRequests)
        .then(serviceResponses => response.send({success: true, payload: serviceResponses}))
        .catch(() => response.status(503).send({success: false, message: 'Error occurred'}))
});
