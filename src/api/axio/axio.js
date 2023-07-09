import Axios from "axios";
import xml2js from "xml2js";
import * as axio_login from "./axio+login.js";
const { version } = require("../../../package.json");

const Axio = class {
  isDebug = false;
  logger = console;

  server = "http://dev1.axiosoft.ru";
  api = "numbers.asmx";
  // wsdl = '?WSDL';

  socket = 4901;
  isLoggedIn = false;
  isIgnoreByDefaultPublication = true;

  current = {};

  constructor() {
    this.clientInfo = `AxioView ${navigator.platform} client v. ${version}`;
  }

  async init(settings = {}) {
    for (const [key, value] of Object.entries(settings)) {
      this[key] = value;
    }
  }

  validate = async function () {
    for (const [key, value] of Object.entries(this)) {
      this.logger.log(
        `${key}: {require('circular-json').stringify( value, censor(value) ) }`
      );
    }
  };

  parseXml = function (xml) {
    return new Promise((resolve, reject) => {
      const parser = new xml2js.Parser();
      parser.parseString(xml, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  clientCall = async function (method, attributes, ignoreError = false) {
    var body = {};
    body[method] = { $: { xmlns: "http://ed5services/" } };
    for (const [key, value] of Object.entries(attributes)) {
      body[method][key] = value;
    }

    const soapReq = {
      "soap:Envelope": {
        $: {
          "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
          "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
          "xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
        },
        "soap:Body": body,
      },
    };

    var builder = new xml2js.Builder();
    var soapRequest = builder.buildObject(soapReq);
    console.log(this.server);
    console.log(this.api);
    console.log(`${this.server.replace(/(\/numbers\.asmx$)/, "")}/${this.api}`);

    const response = await Axios.post(
      `${this.server.replace(/(\/numbers\.asmx$)/, "")}/${this.api}`,
      soapRequest,
      {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      }
    );

    if (this.isDebug)
      this.logger.log(`Arguments: ${JSON.stringify(attributes)}}\n`);
    // this.logger.log(`Arguments: ${JSON.stringify(attributes)}\nError: ${error}\nResult: ${JSON.stringify(result)}\nCookie: ${[self.client.cookie]}\n`)

    var data = await this.parseXml(response.data);
    data = data["soap:Envelope"]?.["soap:Body"]?.[method + "Response"];
    // data = (typeof data?.[method+'Result'] === 'undefined') ? data : data?.[method+'Result'];

    return data;
  };
};
Axio.prototype.registerUser = axio_login.registerUser;
Axio.prototype.unregisterUser = axio_login.unregisterUser;

export default new Axio();
