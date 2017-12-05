"use strict";

const Aws = require("aws-sdk");
const Nbrite = require("nbrite");

const eventsFilename = "events.json";
const contentType = "application/json";
const bucket = "weshare-events-eu-central";

const s3 = new Aws.S3({
    apiVersion: "2006-03-01"
});
const nbrite = new Nbrite({
    token: process.env.eventbriteToken
});

const reducePayload = (res) => {
    if (!res.events) return {};
    return res.events.map(event => {
        return {
            id: event.id,
            name: event.name,
            start: event.start,
            end: event.end,
            url: event.url,
            logo: event.logo,
            description: event.description,
            capacity: event.capacity,
        };
    });
};

const getEvents = () => {
    return nbrite.get("/users/me/owned_events", {
        status: "live"
    }).then(reducePayload);
};

const handler = (event, context, callback) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    getEvents().then((events) => {
        const params = {
            Bucket: bucket,
            Key: eventsFilename,
            Body: JSON.stringify(events, null, 2),
            ContentType: contentType,
            ACL: "public-read"
        };
        s3.putObject(params, (err, events) => {
            if (err) {
                console.log(err);
                const message = `Error putting object ${eventsFilename} in bucket ${bucket}. Make sure this function has access to it, and the bucket is in the same region as this function.`;
                console.log(message);
                callback(message);
            } else {
                const message = `Done writing ${eventsFilename} with content type ${contentType}`;
                console.log(message);
                callback(null, message);
            }
        });
    });
};

exports.handler = handler;