Of course! Here is the documentation for the TikTok API based on the provided examples, written in a clear and developer-friendly format.

---

# TikTok API Documentation

## Introduction

This document provides documentation for the Unofficial TikTok API available on RapidAPI. It allows developers to programmatically access public data from TikTok, including user profiles, posts, followers, and more.

## Authentication

All requests to the TikTok API must be authenticated. This is done by including your RapidAPI key in the request headers. You can obtain your key by subscribing to the API on the [RapidAPI Hub](https://rapidapi.com/yuananf/api/tiktok-api23).

**Required Headers**

| Header            | Description                                   |
| ----------------- | --------------------------------------------- |
| `x-rapidapi-key`  | Your unique RapidAPI subscription key.        |
| `x-rapidapi-host` | The host for this API: `tiktok-api23.p.rapidapi.com` |

---

## User Endpoints

These endpoints are used to retrieve information about specific TikTok users.

### 1. Get User Info

Retrieves basic profile information for a user by their unique username.

*   **Endpoint:** `GET /api/user/info`
*   **Parameters:**

| Parameter  | Type   | Required | Description                     |
| ---------- | ------ | -------- | ------------------------------- |
| `uniqueId` | string | Yes      | The unique username of the user (e.g., `taylorswift`). |

*   **Example Request (Node.js):**
    ```javascript
    const http = require('https');

    const options = {
        method: 'GET',
        hostname: 'tiktok-api23.p.rapidapi.com',
        path: '/api/user/info?uniqueId=taylorswift',
        headers: {
            'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
            'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            const body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    req.end();
    ```

*   **Example Response:**
    ```json
    {
      "shareMeta": {
        "desc": "@taylorswift 32.6m Followers, 0 Following, 248.4m Likes - Watch awesome short videos created by Taylor Swift",
        "title": "Taylor Swift on TikTok"
      },
      "statusCode": 0,
      "userInfo": {
        "stats": {
          "followerCount": 32600000,
          "followingCount": 0,
          "heartCount": 248400000,
          "videoCount": 71
        },
        "user": {
          "avatarLarger": "https://p16-sign-va.tiktokcdn.com/...",
          "id": "6881290705605477381",
          "nickname": "Taylor Swift",
          "secUid": "MS4wLjABAAAAqB08cUbXaDWqbD6MCga2RbGTuhfO2EsHayBYx08NDrN7IE3jQuRDNNN6YwyfH6_6",
          "signature": "This is pretty much just a cat account",
          "uniqueId": "taylorswift",
          "verified": true
        }
      }
    }
    ```

### 2. Get User Info with Region

Retrieves more detailed profile information, including region, for a user by their unique username.

*   **Endpoint:** `GET /api/user/info-with-region`
*   **Parameters:**

| Parameter  | Type   | Required | Description                         |
| ---------- | ------ | -------- | ----------------------------------- |
| `uniqueId` | string | Yes      | The unique username of the user (e.g., `tiktok`). |

*   **Example Request (Node.js):**
    ```javascript
    const http = require('https');

    const options = {
        method: 'GET',
        hostname: 'tiktok-api23.p.rapidapi.com',
        path: '/api/user/info-with-region?uniqueId=tiktok',
        headers: {
            'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
            'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
    };

    // ... request logic ...
    ```

*   **Example Response:**
    ```json
    {
      "userInfo": {
        "user": {
          "id": "107955",
          "uniqueId": "tiktok",
          "nickname": "TikTok",
          "signature": "One TikTok can make a big impact",
          "verified": true,
          "secUid": "MS4wLjABAAAAv7iSuuXDJGDvJkmH_vz1qkDZYo1apxgzaxdBSeIuPiM",
          "region": "US"
        },
        "stats": {
          "followerCount": 89600000,
          "followingCount": 6,
          "heartCount": 378700000,
          "videoCount": 1177
        },
        "statsV2": {
          "followerCount": "89614470",
          "followingCount": "6",
          "heartCount": "378654762",
          "videoCount": "1177"
        }
      },
      "statusCode": 0
    }
    ```

### 3. Get User Info by ID

Retrieves user profile information by their numerical User ID. Note the different response structure compared to other user info endpoints.

*   **Endpoint:** `GET /api/user/info-by-id`
*   **Parameters:**

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `userId`  | string | Yes      | The numerical ID of the user (e.g., `107955`). |

*   **Example Request (Node.js):**
    ```javascript
    const http = require('https');

    const options = {
        method: 'GET',
        hostname: 'tiktok-api23.p.rapidapi.com',
        path: '/api/user/info-by-id?userId=107955',
        headers: {
            'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
            'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
    };

    // ... request logic ...
    ```

*   **Example Response:**
    ```json
    {
      "status_code": 0,
      "user": {
        "avatar_larger": {
          "url_list": [
            "https://p16-sign-va.tiktokcdn.com/..."
          ]
        },
        "follower_count": 81438576,
        "following_count": 2,
        "nickname": "TikTok",
        "sec_uid": "MS4wLjABAAAAv7iSuuXDJGDvJkmH_vz1qkDZYo1apxgzaxdBSeIuPiM",
        "signature": "WANNA MAKE A TIKTOK!?",
        "total_favorited": 325979360,
        "uid": "107955",
        "unique_id": "tiktok"
      }
    }
    ```

### 4. Get User Followers

Retrieves a paginated list of a user's followers.

*   **Endpoint:** `GET /api/user/followers`
*   **Parameters:**

| Parameter   | Type    | Required | Description                                             |
| ----------- | ------- | -------- | ------------------------------------------------------- |
| `secUid`    | string  | Yes      | The secure user ID, obtained from a user info endpoint. |
| `count`     | integer | No       | The number of followers to return per page. Default is 30. |
| `minCursor` | integer | No       | The pagination cursor value from the previous response. |

*   **Example Request (Node.js):**
    ```javascript
    const http = require('https');

    const options = {
        method: 'GET',
        hostname: 'tiktok-api23.p.rapidapi.com',
        path: '/api/user/followers?secUid=MS4wLjABAAAAqB08cUbXaDWqbD6MCga2RbGTuhfO2EsHayBYx08NDrN7IE3jQuRDNNN6YwyfH6_6&count=30&minCursor=0',
        headers: {
            'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
            'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
    };

    // ... request logic ...
    ```

*   **Example Response:**
    ```json
    {
      "hasMore": true,
      "minCursor": 1739263230,
      "total": 32703493,
      "userList": [
        {
          "stats": {
            "followerCount": 27,
            "followingCount": 55,
            "videoCount": 0
          },
          "user": {
            "id": "7440475008314655799",
            "nickname": "_jizen",
            "uniqueId": "_dengueee"
          }
        }
        // ... more users
      ]
    }
    ```

### 5. Get User Followings

Retrieves a paginated list of users that a specific user follows.

*   **Endpoint:** `GET /api/user/followings`
*   **Parameters:**

| Parameter   | Type    | Required | Description                                             |
| ----------- | ------- | -------- | ------------------------------------------------------- |
| `secUid`    | string  | Yes      | The secure user ID, obtained from a user info endpoint. |
| `count`     | integer | No       | The number of followings to return per page. Default is 30. |
| `maxCursor` | integer | No       | The pagination cursor value from the previous response. |

*   **Example Request (Node.js):**
    ```javascript
    const http = require('https');

    const options = {
        method: 'GET',
        hostname: 'tiktok-api23.p.rapidapi.com',
        path: '/api/user/followings?secUid=MS4wLjABAAAAY3pcRUgWNZAUWlErRzIyrWoc1cMUIdws4KMQQAS5aKN9AD1lcmx5IvCXMUJrP2dB&count=30&maxCursor=0',
        headers: {
            'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
            'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
    };

    // ... request logic ...
    ```

*   **Example Response:**
    ```json
    {
      "hasMore": false,
      "maxCursor": 1706822859,
      "userList": [
        {
          "stats": {
            "followerCount": 282000,
            "followingCount": 9,
            "videoCount": 204
          },
          "user": {
            "id": "7307903467192157217",
            "nickname": "Baby lovely",
            "uniqueId": "baby.lovely15"
          }
        }
        // ... more users
      ]
    }
    ```

---

## Post Endpoints

These endpoints retrieve video posts from a user's profile.

### 1. Get User Posts

Retrieves a paginated list of a user's most recent video posts.

*   **Endpoint:** `GET /api/user/posts`
*   **Parameters:**

| Parameter | Type    | Required | Description                                             |
| --------- | ------- | -------- | ------------------------------------------------------- |
| `secUid`  | string  | Yes      | The secure user ID, obtained from a user info endpoint. |
| `count`   | integer | No       | The number of posts to return per page. Default is 35.  |
| `cursor`  | integer | No       | The pagination cursor (timestamp) from the previous response. |

*   **Example Request (Node.js):**
    ```javascript
    const http = require('https');

    const options = {
        method: 'GET',
        hostname: 'tiktok-api23.p.rapidapi.com',
        path: '/api/user/posts?secUid=MS4wLjABAAAAqB08cUbXaDWqbD6MCga2RbGTuhfO2EsHayBYx08NDrN7IE3jQuRDNNN6YwyfH6_6&count=35&cursor=0',
        headers: {
            'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
            'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
    };

    // ... request logic ...
    ```

*   **Example Response:**
    ```json
    {
      "data": {
        "cursor": "1664510413000",
        "hasMore": true,
        "itemList": [
          {
            "id": "7427117204686179630",
            "desc": "Back in the office… 😎 #MiamiTSTheErasTour ",
            "createTime": 1729260489,
            "video": {
              "cover": "https://p19-sign.tiktokcdn-us.com/...",
              "playAddr": "https://v16-webapp-prime.tiktok.com/..."
            },
            "stats": {
              "diggCount": 5800000,
              "shareCount": 352300,
              "commentCount": 106300,
              "playCount": 47800000
            },
            "author": {
              "id": "6881290705605477381",
              "uniqueId": "taylorswift"
            }
          }
          // ... more posts
        ]
      }
    }
    ```

### 2. Get User Popular Posts

Retrieves a user's most popular posts, sorted by play count.

*   **Endpoint:** `GET /api/user/popular-posts`
*   **Parameters:**

| Parameter | Type    | Required | Description                                             |
| --------- | ------- | -------- | ------------------------------------------------------- |
| `secUid`  | string  | Yes      | The secure user ID, obtained from a user info endpoint. |
| `count`   | integer | No       | The number of posts to return per page. Default is 35.  |
| `cursor`  | integer | No       | The pagination cursor.                                  |

*   **Example Request (Node.js):**
    ```javascript
    const http = require('https');

    const options = {
        method: 'GET',
        hostname: 'tiktok-api23.p.rapidapi.com',
        path: '/api/user/popular-posts?secUid=MS4wLjABAAAAqB08cUbXaDWqbD6MCga2RbGTuhfO2EsHayBYx08NDrN7IE3jQuRDNNN6YwyfH6_6&count=35&cursor=0',
        headers: {
            'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
            'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
    };
    // ... request logic ...
    ```
*   **Response:** The response structure is identical to `/api/user/posts`, but the `itemList` is sorted by popularity (play count).

### 3. Get User Oldest Posts

Retrieves a user's oldest posts first.

*   **Endpoint:** `GET /api/user/oldest-posts`
*   **Parameters:**

| Parameter | Type    | Required | Description                                             |
| --------- | ------- | -------- | ------------------------------------------------------- |
| `secUid`  | string  | Yes      | The secure user ID, obtained from a user info endpoint. |
| `count`   | integer | No       | The number of posts to return per page. Default is 30.  |
| `cursor`  | integer | No       | The pagination cursor.                                  |

*   **Example Request (Node.js):**
    ```javascript
    const http = require('https');

    const options = {
        method: 'GET',
        hostname: 'tiktok-api23.p.rapidapi.com',
        path: '/api/user/oldest-posts?secUid=MS4wLjABAAAAqB08cUbXaDWqbD6MCga2RbGTuhfO2EsHayBYx08NDrN7IE3jQuRDNNN6YwyfH6_6&count=30&cursor=0',
        headers: {
            'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY',
            'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
    };
    // ... request logic ...
    ```
*   **Response:** The response structure is identical to `/api/user/posts`, but the `itemList` is sorted from oldest to newest.