const html = `<div><img src="https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=ATCDNfU7kk5v7QYGO66boAEuPug28k0rkPiEaaUygyzcnItdkp3wWsQYoXmgzdNyKi73_wEDE5k99DEslBCmqk8gRukLooaywMNGfKgrKyF1e8Ng65P1M5gCDH6kvhAsJqRCF_zyi2HF3xoClYtFu6_AJZn_6iw4-tCwsVwbNpgNKHVHq_ltpfByHJu4qbLKTXUp9Q_52fkiaf7J-r29MP1zm1L4w0r9Y4t0o9WWBr7-dX5v155z2DE9IXCaKFUw-s1AQW9R8JUTYYn0X2SlqEk5dHHhjdFi9aBIffm4B9dMmjGzj86gWJsmM0HdSTXU2wMaQE5_rRA4OMrkngf1nqqx2N7DxKjKUZtcAHy7J-XcVkABbTVuYO3WQVpIjiOKUjlogt31K9Tn_XQXf-PtpC9_nzArlykSz_U4h3Q52FCuXT7v4nY2sC4EcOP0C15zCr9D&key=AIzaSyBYNKogfCwaE636odEhhwmtwK_EnxU-ztY" alt="Photo"></div>`;
const regex = /https:\/\/maps\.googleapis\.com\/maps\/api\/place\/photo\?[^"'\s)]+/g;

console.log("Original HTML contains URL:", html.includes("maps.googleapis.com"));
console.log("Regex matches:", html.match(regex));

const cleaned = html.replace(regex, "https://replaced.com");
console.log("Cleaned HTML:", cleaned);
