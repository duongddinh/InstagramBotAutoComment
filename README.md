# Instagram Bot Auto‑Commenter Scripts

> **Status:** Confirmed fully working on **June 2025**.
>
> **Terms of Service disclaimer**: Automating Instagram interactions violates Instagram’s Terms of Use. These scripts are provided **strictly for educational or internal‑testing purposes**. Use at your own risk; the author assumes no liability for account suspension, data loss, or any other consequences.

---

## Repository contents

| Script           | Auth method                                                                                                                  | Persistent data |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `logincreds.js`  | Logs in with **username + password** the first time, then re‑uses the cookie jar saved to `cookies.json`.                    | `cookies.json`  |
| `csrfsession.js` | Uses a **pre‑exported `sessionid` + `csrftoken` cookie pair** taken directly from a logged‑in browser session (no 2‑factor). |  None           |

Choose whichever flow best matches your threat model and Instagram account settings.

---

## Requirements

* Node.js
* A (preferably throw‑away) Instagram account **with two‑factor authentication disabled**

---

## Quick start

```bash
# Clone & install dependencies
$ git clone https://github.com/duongddinh/InstagramAutoComment.git
$ cd InstagramAutoComment
$ node [file].js
```

### Create a `.env` file

<summary><code>logincreds.js</code> (username/password method)</summary>

```env
IG_USERNAME=your_username
IG_PASSWORD=your_password
TARGET_POST_URL=https://www.instagram.com/p/POST_ID/
COMMENT_TEXT=Great post!
```


<summary><code>csrfsession.js</code> (cookie method)</summary>

```env
SESSIONID=123456789%3Aabcdef...
CSRFTOKEN=a1b2c3d4e5f6g7h8i9j0
TARGET_POST_URL=https://www.instagram.com/p/POST_ID/
COMMENT_TEXT=Great post!
```


### Run the script

```bash
# Username/password flow
$ node logincreds.js

# Cookie/session flow
$ node csrfsession.js
```

Both scripts will:

1. Launch headless Chromium with safe flags.
2. Validate or establish a logged‑in session.
3. Open `TARGET_POST_URL`.
4. Locate the comment field, type `COMMENT_TEXT` with human‑like delays, press **Enter**, and wait.

A successful run prints:

```
Comment posted successfully!
```

---

## Obtaining **sessionid** & **csrftoken** (cookie flow)

> Only needed for `csrfsession.js`. Skip if you are using the username/password script.

1. **Disable 2FA first**: Instagram invalidates the session cookie whenever a 2‑factor challenge is triggered, so temporarily switch it *Off*:
   *Instagram app -> Settings & Privacy -> Accounts Center -> Password and Security -> Two‑factor authentication*.
2. Log in to instagram.com in a **desktop browser** (Chrome is assumed below).
3. Press **F12** to open DevTools -> **Application** tab -> left sidebar **Storage -> Cookies -> [https://www.instagram.com](https://www.instagram.com)**.
4. Locate the rows named `sessionid` and `csrftoken`.
   *Double‑click* the **Value** column -> **Copy** the entire string for each cookie.
5. Paste both values into `.env` exactly as shown above. Save the file.
6. Keep the browser session alive while testing. If you log out or the cookies expire (typically 1 month or any time you re-authenticate), grab fresh values.

---

## Cookies

It is used to reduce repeated logins

On future runs, it loads those cookies to restore the logged-in session without needing to type credentials again.

This saves time and reduces the risk of triggering Instagram's security systems (like 2FA, captchas, or ratelimiting).

## Use cases

Engagement bot 

Can be modified with GraphAPI to automate looking for hashtags and comment on it using LLM
