const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.initialize();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (message) => {
  console.log(message);
  var msgFirst = message.body.substring(0, message.body.indexOf(" "));
  var msgNFirst = message.body.substring(message.body.indexOf(" ") + 1);

  if (message.body.toLowerCase() == "!randomimg") {
    const media = await MessageMedia.fromUrl("https://picsum.photos/200/300", {
      unsafeMime: true,
    });
    client.sendMessage(message.from, media, {
      caption: "Random Image",
    });
  }

  if (message.body.toLowerCase() === "!hello") {
    message.reply("Hiiiii Bro");
  }

  if (message.body.toLowerCase() === "!meme") {
    //get media from url
    const media = await MessageMedia.fromUrl(
      "https://user-images.githubusercontent.com/41937681/162612030-11575069-33c2-4df2-ab1b-3fb3cb06f4cf.png"
    );

    //replying with media
    client.sendMessage(message.from, media, {
      caption: "meme",
    });
  }

  if (msgFirst.toLowerCase() === "!ygopro") {
    axios
      .get(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(
          msgNFirst
        )}`
      )
      .then(async (res) => {
        if (res.data.error) {
          message.reply(
            "No card matching your query was found in the database."
          );
        } else {
          const media = await MessageMedia.fromUrl(
            res.data.data[0].card_images[0].image_url
          );
          client.sendMessage(message.from, media, {
            caption: `Name : ${res.data.data[0].name}\nType : ${res.data.data[0].type}\nDesc : ${res.data.data[0].desc}
            `,
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
});
