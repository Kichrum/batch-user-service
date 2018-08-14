const app = require('express')(),
    bodyParser = require('body-parser'),
    axios = require('axios');

app.use(bodyParser.json());

/**
 * To use another port, just run:
 * PORT=80 yarn start
 */
app.listen(process.env.PORT || 3005, () => console.log('Server is up and running'));

// Limit 5 requests per 10 seconds
const concurrentRequestsTimeout = 10000,
    concurrentRequestsAmount = 5;

/**
 * Amount of sent requests without response yet
 *
 * @type {number}
 */
let amountOfSendingRequests = 0;

/**
 * This function replaces {userId} param in url with actual value
 *
 * @param url
 * @param userId
 * @returns {string}
 */
const prepareUrl = (url, userId) => {
    if (url.includes('{userId}')) {
        return url.replace('{userId}', userId);
    }
    return url;
};


/**
 * This function converts payload item and endpoint objects to request params for axios
 *
 * @param item
 * @param endpoint
 * @returns {{method: string, url: string, body: Object}}
 */
const prepareServiceRequests = (item, endpoint) => {
    return {
        method: endpoint.verb,
        url: prepareUrl(endpoint.url, item.userId),
        body: item.requestBody
    };
};

/**
 * This function applies limitation: only 5 requests can be sent concurrently per 10 seconds.
 * So that, if amountOfSendingRequests is more than 5,
 * we apply timeout for 10 seconds and re-call this function recursively.
 *
 * @param item
 * @returns {Promise<Object>}
 */
const makeConcurrentServiceCall = item => {
    return new Promise(resolve => {
        if (amountOfSendingRequests >= concurrentRequestsAmount) {
            setTimeout(() => resolve(makeConcurrentServiceCall(item)), concurrentRequestsTimeout);
        } else {
            amountOfSendingRequests++;
            resolve(
                axios(item)
                    .then(() => amountOfSendingRequests--)
                    .catch(() => {
                        amountOfSendingRequests--;
                        return Promise.reject(null);
                    })
            );
        }
    });
};

/**
 * This function makes requests to the service. If request fails, it retries once more.
 *
 * @param requests
 * @returns {Promise<{success: boolean}>[]}
 */
const makeServiceRequests = requests => {
    return requests.map(item => makeConcurrentServiceCall(item)
        .catch(() => makeConcurrentServiceCall(item))
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
