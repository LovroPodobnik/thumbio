Of course. Here is the provided information structured as developer documentation, tailored for developers who might be integrating this with an LLM or building applications on top of it.

---

# **TikTok API Documentation (tiktok-api23)**

This document provides instructions and examples for interacting with the `tiktok-api23` on RapidAPI. It covers authentication, available endpoints, request parameters, and response structures.

## **Base URL**

All API requests should be made to the following base URL:

`https://tiktok-api23.p.rapidapi.com`

## **Authentication**

All requests to the API must include the following headers for authentication:

-   `x-rapidapi-key`: Your unique API key from RapidAPI.
-   `x-rapidapi-host`: `tiktok-api23.p.rapidapi.com`

---

## **Endpoints**

### 1. Get Post Details

Fetches detailed information for a specific TikTok post using its video ID.

`GET /api/post/detail`

#### **Query Parameters**

| Parameter | Type   | Required | Description                               |
| :-------- | :----- | :------- | :---------------------------------------- |
| `videoId` | string | **Yes**  | The unique identifier for the TikTok video. |

#### **Example Request (Node.js)**

```javascript
const https = require('https');

const options = {
	method: 'GET',
	hostname: 'tiktok-api23.p.rapidapi.com',
	port: null,
	path: '/api/post/detail?videoId=7306132438047116586',
	headers: {
		'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY', // Replace with your actual key
		'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
	}
};

const req = https.request(options, function (res) {
	const chunks = [];

	res.on('data', function (chunk) {
		chunks.push(chunk);
	});

	res.on('end', function () {
		const body = Buffer.concat(chunks);
		const responseData = JSON.parse(body.toString());
		console.log(responseData);
	});
});

req.end();
```

#### **Response Body Structure**

The response is a JSON object containing the full details of the video post. The most important data is located within `itemInfo.itemStruct`.

-   `itemInfo` (Object): Container for the main item data.
    -   `itemStruct` (Object): The core video post object.
        -   `id` (String): The unique ID of the video.
        -   `desc` (String): The video's caption or description.
        -   `createTime` (String): A Unix timestamp of when the video was created.
        -   `author` (Object): Contains information about the post's creator.
            -   `id` (String): The author's unique user ID.
            -   `uniqueId` (String): The author's username (e.g., "taylorswift").
            -   `nickname` (String): The author's display name.
            -   `signature` (String): The author's bio.
            -   `avatarThumb` (String): URL to the author's thumbnail-sized profile picture.
        -   `music` (Object): Contains details about the sound used in the video.
            -   `playUrl` (String): A direct URL to the audio file.
            -   `title` (String): The title of the sound.
            -   `authorName` (String): The creator of the sound.
        -   `stats` (Object): Contains the primary engagement statistics for the video.
            -   `playCount` (Number): Total number of views.
            -   `diggCount` (Number): Total number of likes.
            -   `commentCount` (Number): Total number of comments.
            -   `shareCount` (Number): Total number of shares.
        -   `video` (Object): Contains video-specific data and URLs.
            -   `playAddr` (String): A direct, unwatermarked URL to the video file.
            -   `cover` (String): URL to the video's cover image.
            -   `height` (Number): The height of the video in pixels.
            -   `width` (Number): The width of the video in pixels.
            -   `duration` (Number): The duration of the video in seconds.
            -   `ratio` (String): The video's resolution ratio (e.g., "540p").

#### **Example Success Response (`200 OK`)**

```json
{
  "itemInfo": {
    "itemStruct": {
      "id": "7306132438047116586",
      "desc": "Hi! Well, so, basically I have a birthday coming up and I was thinking a fun way to celebrate the year we’ve had together would be to make The Eras Tour Concert Film available for you to watch at home! ...",
      "createTime": "1701091554",
      "author": {
        "id": "6881290705605477381",
        "uniqueId": "taylorswift",
        "nickname": "Taylor Swift",
        "signature": "This is pretty much just a cat account"
      },
      "music": {
        "id": "7306132624873917226",
        "title": "original sound",
        "playUrl": "https://v16-webapp-prime.tiktok.com/video/tos/useast5/...",
        "authorName": "Taylor Swift",
        "duration": 59
      },
      "stats": {
        "collectCount": "291901",
        "commentCount": 68700,
        "diggCount": 5300000,
        "playCount": 44400000,
        "shareCount": 91200
      },
      "video": {
        "height": 1024,
        "width": 576,
        "duration": 59,
        "ratio": "540p",
        "playAddr": "https://v16-webapp-prime.tiktok.com/video/tos/maliva/...",
        "cover": "https://p16-sign.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/..."
      }
    }
  },
  "statusCode": 0,
  "statusMsg": "ok"
}
```

---

### 2. Get Trending Posts

Retrieves a list of trending TikTok posts. This endpoint supports pagination.

`GET /api/post/trending`

#### **Query Parameters**

| Parameter | Type    | Required | Description                                                                                             |
| :-------- | :------ | :------- | :------------------------------------------------------------------------------------------------------ |
| `count`   | integer | No       | The number of trending posts to return. Defaults to a server-side value (e.g., 16).                   |
| `cursor`  | string  | No       | The pagination cursor from a previous response. Used to fetch the next page of results. Omit for the first page. |

#### **Example Request (Node.js)**

```javascript
const https = require('https');

const options = {
	method: 'GET',
	hostname: 'tiktok-api23.p.rapidapi.com',
	port: null,
	path: '/api/post/trending?count=16',
	headers: {
		'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY', // Replace with your actual key
		'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
	}
};

const req = https.request(options, function (res) {
	const chunks = [];

	res.on('data', function (chunk) {
		chunks.push(chunk);
	});

	res.on('end', function () {
		const body = Buffer.concat(chunks);
		const responseData = JSON.parse(body.toString());
		console.log(responseData);
	});
});

req.end();
```

#### **Response Body Structure**

The response is a JSON object containing a list of video items and pagination details.

-   `itemList` (Array of Objects): A list of video post objects. **Each object in this array follows the same structure as `itemStruct` from the `/api/post/detail` endpoint.**
-   `hasMore` (Boolean): `true` if there are more results available for pagination, `false` otherwise.
-   `cursor` (String): An identifier to pass in the `cursor` query parameter of your next request to get the next page.
-   `statusCode` (Number): `0` indicates success.

#### **Example Success Response (`200 OK`)**

```json
{
  "cursor": "0",
  "hasMore": true,
  "itemList": [
    {
      "id": "7503622973002222878",
      "desc": "SOFT HANDS STEVE: PART 2- The PreTrip 🚛 #trucking #trucker #merdzic ...",
      "createTime": 1747073408,
      "author": {
        "id": "6930667336454833157",
        "uniqueId": "merdzictrans",
        "nickname": "MerdzicTrans"
      },
      "music": {
        "id": "7503623047824395038",
        "title": "original sound",
        "authorName": "MerdzicTrans"
      },
      "stats": {
        "collectCount": 8228,
        "commentCount": 1117,
        "diggCount": 132800,
        "playCount": 2100000,
        "shareCount": 9378
      },
      "video": {
        "height": 1024,
        "width": 576,
        "duration": 86,
        "playAddr": "https://v16-webapp-prime.tiktok.com/video/tos/maliva/..."
      }
    },
    {
      "id": "7503620814919503147",
      "desc": "The struggle of a man in a relationship 😅 #andyandmichelle ",
      "createTime": 1747072904,
      "author": {
        "id": "93160285879824384",
        "uniqueId": "andy.and.michelle",
        "nickname": "Andy & Michelle"
      },
      "music": {
        "id": "7146370280443627521",
        "title": "Pretty Little Baby - Stereo Mix",
        "authorName": "Connie Francis"
      },
      "stats": {
        "collectCount": 11600,
        "commentCount": 864,
        "diggCount": 322800,
        "playCount": 2700000,
        "shareCount": 55800
      },
      "video": {
        "height": 1024,
        "width": 576,
        "duration": 8,
        "playAddr": "https://v16-webapp-prime.tiktok.com/video/tos/maliva/..."
      }
    }
    // ... more items
  ],
  "statusCode": 0,
  "status_msg": ""
}
```