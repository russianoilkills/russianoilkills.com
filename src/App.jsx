import { useState, useEffect } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { useWindowSize } from "react-use";
import "./App.css";
import tradeData from "./data.json";
import { interpolateGreys, interpolateOrRd } from "d3-scale-chromatic";
import { scaleLinear } from "d3-scale";
import data from "./topo.json";
import meps from "./meps.json";
import mep_emails from "./mep_emails.json";

const randomSeed = Math.floor(Math.random() * 1000000);

const iso3ToCountryName = {};
for (const feature of data.features) {
  iso3ToCountryName[feature.properties.iso_a3] = feature.properties.sovereignt;
}

const iso2ToCountryName = {};
for (const feature of data.features) {
  iso2ToCountryName[feature.properties.iso_a2] = feature.properties.sovereignt;
}

const iso2ToIso3 = {};
for (const feature of data.features) {
  iso2ToIso3[feature.properties.iso_a2] = feature.properties.iso_a3;
}

const iso3ToIso2 = {};
for (const feature of data.features) {
  iso3ToIso2[feature.properties.iso_a3] = feature.properties.iso_a2;
}

const idToMep = {};
for (const mep of meps) {
  idToMep[mep.id] = mep;
}

const idToMepEmail = {};
for (const mep_email of mep_emails) {
  idToMepEmail[mep_email.id] = mep_email.email;
}

function mepImageUrl(mep) {
  return "https://www.europarl.europa.eu/mepphoto/" + mep.id + ".jpg";
}

function namify(name) {
  function capFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  return name.toLowerCase().split(" ").map(capFirst).join(" ").split("-").map(capFirst).join("-");
}

function mobileCheck() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

const euMainlandBounding = [-10.25, 34.2, 35.0, 71.5];

function getMinMaxFromGeometry(geometry, projection) {
  var minX = null;
  var minY = null;
  var maxX = null;
  var maxY = null;
  if (Array.isArray(geometry[0])) {
    for (const group of geometry) {
      const minMax = getMinMaxFromGeometry(group, projection);
      if (minMax[0] == null) {
        continue;
      }
      if (minX == null) {
        minX = minMax[0];
        minY = minMax[1];
        maxX = minMax[2];
        maxY = minMax[3];
      }
      minX = Math.min(minX, minMax[0]);
      minY = Math.min(minY, minMax[1]);
      maxX = Math.max(maxX, minMax[2]);
      maxY = Math.max(maxY, minMax[3]);
    }
  } else {
    if (
      geometry[0] > euMainlandBounding[0] &&
      geometry[1] > euMainlandBounding[1] &&
      geometry[0] < euMainlandBounding[2] &&
      geometry[0] < euMainlandBounding[3]
    ) {
      const point = projection(geometry);
      return [point[0], point[1], point[0], point[1]];
    } else {
      return [null, null, null, null];
    }
  }
  return [minX, minY, maxX, maxY];
}

function viewBoxOfCountry(iso3, projection) {
  const feature = data.features.find(feature => feature.properties.iso_a3 == iso3);
  if (feature == null) {
    return "0 0 100 100";
  }
  const minMax = getMinMaxFromGeometry(feature.geometry.coordinates, projection);
  console.log(minMax);
  return `${minMax[0]} ${minMax[1]} ${minMax[2] - minMax[0]} ${minMax[3] - minMax[1]}`
}

function mailto(mep, message) {
  return `mailto:${idToMepEmail[mep.id]}?subject=Concerned citizen&body=${encodeURI(message.split("\n").join("\r\n"))}`;
}

const euCountriesIso2 = ["BE","GR","LT","PT","BG","ES","LU","RO","CZ","FR","HU","SI","DK","HR","MT","SK","DE","IT","NL","FI","EE","CY","AT","SE","IE","LV","PL"];
euCountriesIso2.sort((a, b) => iso2ToCountryName[a] == iso2ToCountryName[b] ? 0 : iso2ToCountryName[a] < iso2ToCountryName[b] ? -1 : 1);

function App() {
  const [iso3MapSelected, setIso3MapSelected] = useState("DEU");
  const [isHelp, setIsHelp] = useState(false);
  const { width: w, height } = useWindowSize();
  // const h = Math.min(Math.max(height - 120, 600), 900);
  const h = height;
  const projection = geoMercator()
    .center([w > 640 ? 0 : 14, 52])
    .translate([w / 2, h / 2])
    .scale([w > 640 ? w / 1.5 : w / 1]);
  const path = geoPath().projection(projection);
  const scale = scaleLinear().domain([0, 25e9]).range([0, 1]);

  const [emailAddressCopied, setEmailAddressCopied] = useState(false);
  const [emailContentCopied, setEmailContentCopied] = useState(false);

  function generateMessage(randomSeed, mep, iso2EuSelected) {
    function pick(array) {
      return array[randomSeed % array.length];
    }
    const dear = [`Dear ${namify(mep.fullName)},`];
    const sentence1 = [
      `As a citizen of ${iso2ToCountryName[iso2EuSelected]}, I am greatly concerned about our country's and the EU's continued dependence on Russian energy imports such as oil and gas.`
    ];
    const sentence2 = [
      `Since the beginning of the invasion of Ukraine, this trade is indirectly financing the war.`
    ];
    const sentence3 = [
      `I understand that the transition will be difficult and that it will have a negative economic impact, which will most likely extend to my personal life.`
    ];
    const sentence4 = [
      `However we cannot with good conscience stand by and watch what is happening from afar.`,
      `However I believe that we have a moral duty to do what we can to stop this unjust violence.`
    ];
    const sentence5 = [
      `Please support the initiatives that sanction the energy trade with Russia and help us transition to alternative energy sources.`
    ];
    const bye = [
      `Yours sincerely,
<YOUR NAME HERE>`
    ];

    return `${pick(dear)}

${pick(sentence1)} ${pick(sentence2)}
${pick(sentence3)} ${pick(sentence4)}

${pick(sentence5)}

${pick(bye)}`;
  }

  const [iso2EuSelected, setIso2EuSelected] = useState("DEU");
  useEffect(() => {
    const iso2 = iso3ToIso2[iso3MapSelected];
    if (euCountriesIso2.includes(iso2)) {
      setIso2EuSelected(iso2);
    }
  }, [iso3MapSelected])

  const countryMeps = meps.filter(mep => mep.iso2 == iso2EuSelected);
  const randomMep = countryMeps.length > 0 ? countryMeps[randomSeed % countryMeps.length] : meps[randomSeed % meps.length];
  const [mep, setMep] = useState(randomMep);
  useEffect(() => { setMep(randomMep); }, [iso2EuSelected]);

  console.log(mep);

  const generatedMessage = generateMessage(randomSeed, mep, iso2EuSelected);

  const tradeAmount = tradeData.find(
    (item) => item.iso === iso3MapSelected
  )?.amount;

  const isMobile = mobileCheck();

  const logo = (
  <div>
    <div className="flex items-center pl-4 pt-2 text-xl sm:text-3xl font-bold text-white align-top">
      <div className="pb-4">
      <svg
        viewBox="0 0 17 24"
        //viewBox="0 0 15 20"
        fill="none"
        className="mt-5 mr-2 sm:mr-4 transform drop-shadow-xl w-8 h-10 sm:w-10 sm:h-12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.04 0C8.04 0 0 5.38957 0 12.276C0 13.7662 0.593468 17.586 1.608 18.8542C1.84077 19.1161 2.3052 19.3084 2.77997 19.5051C3.49781 19.8024 4.23927 20.1095 4.23927 20.6815C4.23927 21.7778 4.60473 22.2895 5.33564 22.728C5.55491 23.0204 5.84728 23.0935 6.06655 23.0204C6.28582 23.3127 6.72437 23.3858 7.01673 23.1665C7.30909 23.3858 7.74764 23.3858 7.96691 23.1665C7.99724 23.1438 8.02128 23.1116 8.04 23.0722C8.05873 23.1116 8.08276 23.1438 8.11309 23.1665C8.33236 23.3858 8.77091 23.3858 9.06327 23.1665C9.35563 23.3858 9.79418 23.3127 10.0135 23.0204C10.2327 23.0935 10.5251 23.0204 10.7444 22.728C11.4753 22.2895 11.8407 21.7778 11.8407 20.6815C11.8407 20.1095 12.5822 19.8024 13.3 19.5051C13.7748 19.3084 14.2392 19.1161 14.472 18.8542C15.4971 17.5728 16.08 13.7881 16.08 12.276C16.08 5.77091 8.04 0 8.04 0Z"
          fill="currentcolor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.87055 19.1465C6.87055 18.5618 7.60146 17.4655 8.04 17.3193C8.47855 17.4655 9.20946 18.6349 9.06327 19.1465C9.06327 19.4389 8.844 19.5851 8.62473 19.5851C8.25927 19.5851 8.04 19.2927 7.96691 19.0004C7.96691 19.2196 7.67455 19.5851 7.30909 19.5851C7.08982 19.5851 6.87055 19.4389 6.87055 19.1465ZM10.452 14.0302C11.3291 12.7876 12.4255 13.9571 12.4255 15.0535C12.4255 16.0767 11.6945 17.4655 10.2327 17.4655C9.50182 17.4655 8.99018 16.9538 8.77091 16.0036C8.99018 15.7113 10.0135 14.5418 10.452 14.0302ZM5.628 14.0302C4.75091 12.7876 3.65454 13.9571 3.65454 15.0535C3.65454 16.0767 4.38545 17.4655 5.84727 17.4655C6.57818 17.4655 7.08982 16.9538 7.30909 16.0036C7.08982 15.7113 6.06654 14.5418 5.628 14.0302Z"
          fill="black"
        />
      </svg>
      </div>
      <span className="uppercase leading-none tracking-wide font-black drop-shadow-xl">
        Russian
        <br />
        Oil
        <br />
        Kills
      </span>
    </div>
  </div>    
  );

  if (isHelp && !isMobile) {
    return (
      <div>
        <div className="flex sm:absolute sm:left-0 sm:top-0 sm:h-full">
          <div className="flex-col">
            {logo}
            <div className="pl-6 ml-2">

              <div className="mt-4 text-md font-bold tracking-wide text-gray-400">
                Reach out to your EU representatives!<br></br>
                <br></br>
                Pick country:
              </div>

              <div className="mb-3 xl:w-40">
                <select className="form-select appearance-none
                  block
                  w-full
                  px-3
                  py-1.5
                  text-base
                  font-normal
                  text-gray-700
                  bg-white bg-clip-padding bg-no-repeat
                  border border-solid border-gray-300
                  rounded
                  transition
                  ease-in-out
                  m-0
                  focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  aria-label="Country selector"
                  onChange={(event) => setIso3MapSelected(iso2ToIso3[event.target.value])}
                  defaultValue={iso3ToIso2[iso3MapSelected]}
                  >
                    {
                      euCountriesIso2.map(iso2 => <option value={iso2}>{iso2ToCountryName[iso2]}</option>)
                    }
                </select>
              </div>

              <div className="mt-4 text-md font-bold tracking-wide text-gray-400">
                Pick representative:
              </div>

              <div className="mb-3 xl:w-40">
                <select className="form-select appearance-none
                  block
                  w-full
                  px-3
                  py-1.5
                  text-base
                  font-normal
                  text-gray-700
                  bg-white bg-clip-padding bg-no-repeat
                  border border-solid border-gray-300
                  rounded
                  transition
                  ease-in-out
                  m-0
                  focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  aria-label="Country selector"
                  onChange={(event) => setMep(idToMep[event.target.value])}
                  value={countryMeps.some(cMep => cMep.id == mep.id) ? mep.id : randomMep.id}
                  >
                    {
                      countryMeps.map(mep => <option value={mep.id}>{mep.fullName}</option>)
                    }
                </select>
              </div>

              <button
                className="mt-12 bg-red-600 hover:bg-red-700 text-white px-6 py-3 uppercase tracking-wider font-bold text-sm"
                onClick={() => setIsHelp(false)}
              >
                Back to map
              </button>
            </div>
          </div>
          {/* Preload images */}
          <link rel="preload" as="image" href={mepImageUrl(mep)}></link>
          <div className="hidden">
            {
              countryMeps.map(mep => <img src={mepImageUrl(mep)} onerror="this.src='https://www.europarl.europa.eu/mepphoto/0.jpg'"></img>)
            }
          </div>

          <div className="flex flex-col pl-6 pt-8">
            <div className="flex max-h-32 max-w-6xl">
              <div className="flex-none w-24 h-32">
                <img className="max-h-full" src={mepImageUrl(mep)}></img>
              </div>
              <div className="grow max-h-full pl-6 text-md tracking-wide text-gray-400 relative">
                Name: {mep.fullName}
                <br></br>
                Party: {mep.nationalPoliticalGroup}
                <div className="flex absolute bottom-0">
                  E-mail: <span className="pl-1 pr-1 font-bold"><a href={mailto(mep, generatedMessage)}>{idToMepEmail[mep.id]}</a></span>
                  <div>
                    <button
                      className="pl-1 pr-1 bg-white-100 hover:bg-blue-700 text-white tracking-wider font-bold text-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(idToMepEmail[mep.id]);
                        setEmailAddressCopied(true);
                        setTimeout(() => setEmailAddressCopied(false), 1000);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  {emailAddressCopied ? (
                  <div className="pl-1">
                    Copied!
                  </div>
                  ) : <div></div>}
                </div>
              </div>
            </div>
            <div className="pt-4 text-md font-bold tracking-wide text-gray-400">
              Example email: <span className="text-red-500"> Don't forget to use your own name, and feel free to make it personal!</span>
            </div>
            <div className="whitespace-pre-line max-h-64 h-full">
              <textarea readOnly className="pl-1 w-full text-black text-sm h-full"
              value={generatedMessage}
              ></textarea>
            </div>
            <div className="flex">
              <div>
                <button
                  className="pl-1 pr-1 bg-white-100 hover:bg-blue-700 text-white tracking-wider font-bold text-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedMessage);
                    setEmailContentCopied(true);
                    setTimeout(() => setEmailContentCopied(false), 1000);
                  }}
                >
                  Copy
                </button>
              </div>
              {emailContentCopied ? (
              <div className="pl-1">
                Copied!
              </div>
              ) : <div></div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isHelp && !isMobile) {
  return (
    <div className="w-screen h-screen bg-gray-700">
      <div>
        <div className="relative">
          <svg
            className="bg-gray-800 map"
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}
          >
            {data.features
              .filter(
                (feature) =>
                  isEurope(feature) && feature.properties.iso_a2 !== "RU"
              )
              .map((feature) => (
                <path
                  d={path(feature)}
                  stroke={
                    feature.properties.iso_a2 === "RU"
                      ? "black"
                      : "rgba(8, 81, 156, 0.2)"
                  }
                  strokeWidth={feature.properties.iso_a2 === "RU" ? 3 : 1}
                  fill={getFill(tradeData, feature, scale, iso3MapSelected)}
                  onClick={() => setIso3MapSelected(feature.properties.iso_a3)}
                />
              ))}
            {data.features
              .filter((feature) => feature.properties.iso_a2 === "RU")
              .map((feature) => (
                <path
                  d={path(feature)}
                  stroke={"black"}
                  strokeWidth={4}
                  fill={getFill(tradeData, feature, scale, iso3MapSelected)}
                  onClick={() => setIso3MapSelected(feature.properties.iso_a3)}
                />
              ))}
          </svg>
          <div className="absolute inset-0 map-shadow pointer-events-none" />

          <div className="absolute left-0 top-0">
            {logo}
          </div>

        </div>

        {tradeAmount && (
          <div className="flex flex-col justify-center py-10 sm:absolute sm:left-0 sm:top-0 sm:h-full">
            <div className="pl-6 ml-2">
              <div className="mt-8 text-md font-bold tracking-wide text-gray-400">
                <span className="text-2xl font-bold text-red-600">{iso3ToCountryName[iso3MapSelected]}</span>
                <span> paid</span>
              </div>
              <div className="sm:mt-4 text-3xl sm:text-[3rem] text-red-600 font-bold tracking-wider">
                {tradeAmount.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                })}
              </div>
              <div className="mt-4 text-md font-bold tracking-wide text-gray-400">
                <div>for Russian oil and oil products in 2020 <a className="text-xs" href="https://comtrade.un.org/api/get?max=502&type=C&freq=A&px=HS&ps=2020&r=643&p=all&rg=2&cc=27">[source: UN Comtrade]</a></div>
              </div>
              <div className="mt-1 text-md font-bold tracking-wide text-gray-400">
              From this money Russia could buy
              </div>
              <div>
                <div className="mt-2 flex">
                  <div className="flex-none w-16">
                  <svg
                    width="50"
                    height="32"
                    viewBox="0 0 50 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.61852 13.9218L10.9656 14.5214C11.4245 14.6037 11.7862 14.9529 11.8791 15.4031L12.0475 16.2212H25.3999L27.0785 13.8409C27.2935 13.5362 27.1184 13.1146 26.7485 13.0455C17.9813 11.4099 18.2391 11.4144 17.3038 11.4144H17.3726V10.862C17.3726 10.7316 17.2708 10.6259 17.1414 10.6148C17.152 10.4588 17.2831 10.3209 17.4605 10.3209H20.2131C20.2557 10.3209 20.2903 10.2868 20.2903 10.2448V10.1894C20.2903 10.1474 20.2557 10.1133 20.2131 10.1133H17.4605V9.59902H17.3291V9.76976H15.6627V9.9705C14.6043 9.81254 13.5514 10.1061 13.1141 10.6127H13.0549C12.9151 10.6127 12.802 10.7242 12.802 10.862V11.4144H9.56077V10.764H9.38115C9.38115 9.06012 9.40349 9.11605 9.32922 9.11605C9.30036 9.11605 9.27709 9.13901 9.27709 9.16734V10.764H9.1613V11.4144H8.79831C8.68011 9.86587 8.29981 8.34327 7.66933 6.91086C7.66114 6.89234 7.63955 6.88401 7.6213 6.89179C7.60288 6.89976 7.59469 6.92087 7.60269 6.93939C8.22945 8.36272 8.60751 9.87568 8.72553 11.4144H7.67381C7.50274 11.4144 7.36424 11.5511 7.36424 11.7196V13.6216C7.36424 13.769 7.47128 13.8955 7.61852 13.9218Z"
                      fill="white"
                    />
                    <path
                      d="M48.8582 14.3687H42.0098V14.3264C42.0098 14.1888 41.8976 14.0772 41.7593 14.0772H35.7936C35.6551 14.0772 35.5431 14.1888 35.5431 14.3264V14.3687H27.1134L26.2861 15.5416H35.5431V15.5836C35.5431 15.7214 35.6551 15.8329 35.7936 15.8329H41.7593C41.8976 15.8329 42.0098 15.7214 42.0098 15.5836V15.5416H48.8582C48.9779 15.5416 49.0748 15.4451 49.0748 15.3261V14.584C49.0748 14.4651 48.9779 14.3687 48.8582 14.3687Z"
                      fill="white"
                    />
                    <path
                      d="M26.0474 16.5718L22.5201 16.5757L22.4985 16.6018H11.3174L11.1939 16.0931H2.77302V17.2707H1.17159L-0.0439453 19.0346L5.10116 20.7985H28.7394L37.2265 19.4974L35.6747 17.2707C31.3786 17.2707 33.5056 17.4103 26.0474 16.5718Z"
                      fill="white"
                    />
                    <path
                      d="M36.4168 19.9511C36.1365 21.272 34.3586 21.5435 33.6896 20.3692L32.9995 20.4749C34.3206 22.1029 33.1596 24.5531 31.039 24.5531C29.2613 24.5531 28.0415 22.7664 28.698 21.1227H27.787C28.4438 22.7668 27.2228 24.5531 25.446 24.5531C23.6682 24.5531 22.4483 22.7664 23.1049 21.1227H22.194C22.8506 22.7668 21.6298 24.5531 19.8529 24.5531C18.0752 24.5531 16.8553 22.7662 17.5117 21.1227H16.6009C17.2576 22.7668 16.0367 24.5531 14.2597 24.5531C12.482 24.5531 11.2622 22.7662 11.9187 21.1227H11.0077C11.6644 22.7668 10.4437 24.5531 8.66673 24.5531C6.88902 24.5531 5.669 22.7664 6.32554 21.1227H5.63475C4.70383 22.5894 2.41702 21.9538 2.38854 20.2192L0.751179 19.6577C1.30236 20.6012 3.86133 22.8462 6.85253 24.5861C7.44131 24.9285 8.11237 25.107 8.79442 25.107L31.032 24.8464C31.6593 24.8464 32.278 24.6968 32.8318 24.4036C34.144 23.7094 36.3926 22.2101 36.6501 19.9905C36.653 19.9651 36.6534 19.9399 36.6517 19.9151L36.4168 19.9511Z"
                      fill="white"
                    />
                    <path
                      d="M8.66681 24.1896C10.2351 24.1896 11.2626 22.5553 10.5826 21.1548H6.75078C6.07172 22.5535 7.09684 24.1896 8.66681 24.1896Z"
                      fill="white"
                    />
                    <path
                      d="M14.2598 24.1896C15.828 24.1896 16.8558 22.5553 16.1758 21.1548H12.3439C11.6649 22.5535 12.69 24.1896 14.2598 24.1896Z"
                      fill="white"
                    />
                    <path
                      d="M5.28553 21.1087H5.00556L2.69994 20.3183C2.80549 21.62 4.46164 22.1252 5.28553 21.1087Z"
                      fill="white"
                    />
                    <path
                      d="M31.039 24.2109C32.9347 24.2109 33.8737 21.9257 32.5449 20.6001L29.1506 21.1205C28.4199 22.52 29.4393 24.2109 31.039 24.2109Z"
                      fill="white"
                    />
                    <path
                      d="M19.8529 24.1896C21.4212 24.1896 22.4489 22.5553 21.7689 21.1548H17.9368C17.2578 22.5535 18.2829 24.1896 19.8529 24.1896Z"
                      fill="white"
                    />
                    <path
                      d="M36.1585 20.004L33.9736 20.3389C34.5461 21.2014 35.875 20.9992 36.1585 20.004Z"
                      fill="white"
                    />
                    <path
                      d="M25.4461 24.1896C27.0144 24.1896 28.0419 22.5553 27.3619 21.1548H23.5301C22.851 22.5535 23.8762 24.1896 25.4461 24.1896Z"
                      fill="white"
                    />
                  </svg>
                  </div>

                  <div className="flex-none inline-block text-red-600 font-bold text-md text-2xl">{Math.floor(tradeAmount/500000)}</div><div className="pt-1 pl-2 text-gray-400 text-md font-bold"> T-72 main battle tanks <a className="text-xs" href="https://www.reuters.com/article/ozatp-ethiopia-tanks-ukraine-20110610-idAFJOE7590IR20110610">[source: Reuters]</a> </div>
                </div>
                <div className="mt-2 flex">
                <div className="flex-none w-16">

                  <svg
                    width="50"
                    height="32"
                    viewBox="0 0 50 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M33.7061 12.6117L33.5171 14.5632L30.4534 14.1709L30.5614 12.4247L33.7061 12.6117ZM37.7401 15.0347C36.9123 14.9454 36.2818 14.892 35.8405 14.8653C35.3991 14.8386 34.7584 14.7769 33.9119 14.6691L34.1019 12.6117C35.0647 12.6918 36.2818 13.5023 37.7401 15.0347ZM30.8501 21.2706V22.2422H26.3374V21.3774L30.8501 21.2706ZM34.7854 21.4575L34.5964 21.1637C34.4604 21.6537 34.0562 21.9825 33.3988 22.1436C32.7414 22.3122 32.0932 22.3389 31.4619 22.2422V21.2706L35.8665 20.4868L35.9745 20.6738H35.0741V21.5551L36.7577 21.6629L36.9467 21.1637L43.2259 21.5551V21.3774L37.0557 20.8791L36.9467 20.5936L36.3712 20.6738L36.2632 20.3883C37.2102 20.2999 37.8118 20.1479 38.0567 19.925C38.2989 19.7114 39.1099 19.4802 40.4872 19.2398C40.8578 19.1146 41.2163 18.5537 41.5683 17.5646C41.7211 17.2883 41.7937 16.9945 41.7657 16.6925C41.7406 16.3895 41.3793 16.1307 40.6949 15.9253L38.4255 15.2392C37.1097 13.8854 36.2362 13.0841 35.8209 12.8428C35.4168 12.6034 34.642 12.4247 33.5171 12.3179L30.3817 12.0333L29.877 11.5342L28.6068 11.4623V11.1685L32.543 10.9632V10.7771L49.1428 9.31557V9.11111L28.1114 10.6786L7.17958 9.39569V9.61027L24.0671 10.7771V11.0709L27.5256 11.1685V11.4623L22.986 11.641C22.2112 11.6944 21.9961 11.8629 22.3379 12.1494C22.6889 12.4339 22.7793 12.6209 22.6172 12.7093C22.3192 12.8705 21.8965 13.1735 21.3564 13.6091C20.8069 14.0548 20.536 14.2777 20.536 14.2777C20.3022 13.8412 19.9782 13.7251 19.5461 13.9388C19.1131 14.1442 19.0228 14.5098 19.2668 15.0347L17.1054 14.4554L16.9974 15.6315L19.3747 16.6031L7.28666 17.9569L4.11682 15.4271L6.09753 13.2886L5.98954 12.9948L3.64843 14.9546L2.85505 14.2777L1.18911 14.3578L2.17062 16.104L-3.05176e-05 18.0638L0.10796 18.3483L2.45833 16.4963L4.51258 19.809C4.1792 20.2105 3.83746 20.4417 3.48639 20.5135C3.13439 20.5844 2.75632 20.6379 2.35125 20.6738C2.01788 20.7263 1.91825 20.8165 2.0449 20.9583C2.17899 21.1011 2.31492 21.1637 2.45833 21.1637C2.95467 21.1186 3.38677 21.0477 3.77415 20.9583C4.16154 20.8699 4.57591 20.6563 5.01638 20.3081L18.6903 20.5936L18.3653 21.2706H18.87L19.2668 20.6738L25.842 21.4575V22.2422H23.7794L23.6714 22.6336H32.4359C33.8942 22.5267 34.6783 22.1344 34.7854 21.4575Z"
                      fill="white"
                    />
                  </svg>
                  </div>
                  <div className="flex-none inline-block text-red-600 font-bold text-md text-2xl">{Math.floor(tradeAmount/(153000000/4))}</div><div className="pt-1 pl-2 text-gray-400 text-md font-bold"> Mi-35M attack helicopters <a className="text-xs" href="https://thediplomat.com/2016/12/pakistan-to-receive-4-attack-helicopters-from-russia/">[source: The Diplomat]</a></div>
                </div>
              </div>
              <button
                className="mt-12 bg-red-600 hover:bg-red-700 text-white px-6 py-3 uppercase tracking-wider font-bold text-sm"
                onClick={() => setIsHelp(true)}
              >
                How can you help?
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full pt-4 hidden">
        <div className="text-center">
          {iso3MapSelected}{" "}
          <span className="font-bold">
            {tradeAmount &&
              Number(tradeAmount).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                notation: "compact",
              })}
          </span>
        </div>
      </div>
    </div>
  );
  }

  if (!isHelp && isMobile) {
    return (
      <div>
        <div className="flex sm:absolute sm:left-0 sm:top-0 sm:h-full">
          <div className="flex-col w-full h-full">
            {logo}
            <div className="pl-2 ml-2">

        {tradeAmount && (
          <div className="flex flex-col">
            <div className="m-auto">
              <div className="text-md font-bold tracking-wide text-gray-400">
                <div className="flex justify-center">
                <select className="form-select appearance-none
                  block
                  px-3
                  py-1.5
                  text-2xl
                  font-bold
                  text-red-600
                  rounded
                  transition
                  ease-in-out
                  bg-transparent
                  m-0"
                  aria-label="Country selector"
                  onChange={(event) => setIso3MapSelected(iso2ToIso3[event.target.value])}
                  defaultValue={iso3ToIso2[iso3MapSelected]}
                  >
                    {
                      euCountriesIso2.map(iso2 => <option value={iso2}>{iso2ToCountryName[iso2]}</option>)
                    }
                </select>
                <div className="pl-6">
          <svg
            className="map"
            viewBox={viewBoxOfCountry(iso3MapSelected, projection)}
            width="6em"
            height="6em"
          >
            {data.features
              .filter(
                (feature) =>
                  feature.properties.iso_a3 == iso3MapSelected
              )
              .map((feature) => (
                <path
                  d={path(feature)}
                  stroke={
                    "rgba(8, 81, 156, 0.2)"
                  }
                  strokeWidth={1}
                  fill={getFill(tradeData, feature, scale, iso3MapSelected)}
                />
              ))}
          </svg>
          </div>
                </div>
              </div>
              <div className="pt-2 flex items-center">
                <div className="text-md font-bold tracking-wide text-gray-400">paid</div>
                <div className="pl-2 sm:mt-4 text-3xl sm:text-[3rem] text-red-600 font-bold tracking-wider">
                  {tradeAmount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0,
                  })}
                </div>
              </div>
              <div className="mt-4 text-md font-bold tracking-wide text-gray-400">
                <div>for Russian oil in 2020 <a className="text-xs" href="https://comtrade.un.org/api/get?max=502&type=C&freq=A&px=HS&ps=2020&r=643&p=all&rg=2&cc=27">[source: UN Comtrade]</a></div>
              </div>
              <div className="mt-1 text-md font-bold tracking-wide text-gray-400">
              From this money Russia could buy
              </div>
              <div>
                <div className="mt-2 flex">
                  <div className="flex-none inline-block text-red-600 font-bold text-md text-2xl">{Math.floor(tradeAmount/500000)}</div><div className="pt-1 pl-2 text-gray-400 text-md font-bold"> T-72 main battle tanks <a className="text-xs" href="https://www.reuters.com/article/ozatp-ethiopia-tanks-ukraine-20110610-idAFJOE7590IR20110610">[source: Reuters]</a> </div>
                </div>
                <div className="mt-2 flex">
                  <div className="flex-none inline-block text-red-600 font-bold text-md text-2xl">{Math.floor(tradeAmount/(153000000/4))}</div><div className="pt-1 pl-2 text-gray-400 text-md font-bold"> Mi-35M helicopters <a className="text-xs" href="https://thediplomat.com/2016/12/pakistan-to-receive-4-attack-helicopters-from-russia/">[source: The Diplomat]</a></div>
                </div>
              </div>
              <div className="pt-6 mt-auto flex justify-center">
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 uppercase tracking-wider font-bold text-sm"
                onClick={() => setIsHelp(true)}
              >
                How can you help?
              </button>
              </div>

            </div>
          </div>)}
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (isHelp && isMobile) {
    return (
      <div>
          <div className="flex-col">
            {logo}
            <div className="pl-6 sm:pl-20 ml-2">

              <div className="mt-4 text-md font-bold tracking-wide text-gray-400">
                Reach out to your EU representatives!<br></br>
                <br></br>
              </div>
              <div className="flex pr-6">
              <div className="flex-col">
              <div className="text-md font-bold tracking-wide text-gray-400">
                Country:
              </div>

              <div className="mb-3 xl:w-40">
                <select className="form-select appearance-none
                  block
                  w-full
                  px-3
                  py-1.5
                  text-base
                  font-normal
                  text-gray-700
                  bg-white bg-clip-padding bg-no-repeat
                  border border-solid border-gray-300
                  rounded
                  transition
                  ease-in-out
                  m-0
                  focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  aria-label="Country selector"
                  onChange={(event) => setIso3MapSelected(iso2ToIso3[event.target.value])}
                  defaultValue={iso3ToIso2[iso3MapSelected]}
                  >
                    {
                      euCountriesIso2.map(iso2 => <option value={iso2}>{iso2ToCountryName[iso2]}</option>)
                    }
                </select>
              </div>
              </div>

              <div className="pl-4 flex-col">

              <div className="text-md font-bold tracking-wide text-gray-400">
                Representative:
              </div>

              <div className="mb-3 xl:w-40">
                <select className="form-select appearance-none
                  block
                  w-full
                  px-3
                  py-1.5
                  text-base
                  font-normal
                  text-gray-700
                  bg-white bg-clip-padding bg-no-repeat
                  border border-solid border-gray-300
                  rounded
                  transition
                  ease-in-out
                  m-0
                  focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  aria-label="Country selector"
                  onChange={(event) => setMep(idToMep[event.target.value])}
                  value={countryMeps.some(cMep => cMep.id == mep.id) ? mep.id : randomMep.id}
                  >
                    {
                      countryMeps.map(mep => <option value={mep.id}>{mep.fullName}</option>)
                    }
                </select>
              </div>
              </div>
              </div>
            </div>
          </div>
          <link rel="preload" as="image" href={mepImageUrl(mep)}></link>

          <div className="flex flex-col pl-8 pt-2">
            <div className="flex max-h-32 max-w-6xl">
              <div className="flex-none w-24 h-32">
                <img className="max-h-full" src={mepImageUrl(mep)}></img>
              </div>
              <div className="flex-col pl-4 pr-2 m-auto">
                            <a className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 uppercase tracking-wider font-bold text-base" href={mailto(mep, generatedMessage)}>Send e-mail</a>
              </div>
            </div>
            <div className="text-red-500 font-bold pr-4">An example email is included, but don't forget to use your own name, and feel free to make it personal!</div>
            <div className="pt-6 m-auto">
                          <button
                            className="m-auto bg-red-800 hover:bg-red-900 text-white px-6 py-3 uppercase font-bold text-xs"
                            onClick={() => setIsHelp(false)}
                          >
                            Back to map
                          </button>
            </div>

          </div>
      </div>
    );
  }
}

function isEurope(feature) {
  return (
    feature.properties.region_wb === "Europe & Central Asia" ||
    feature.properties.region_wb === "Middle East & North Africa"
  );
}

function getFill(tradeData, feature, scale, iso3MapSelected) {
  if (feature.properties.iso_a3 === iso3MapSelected) {
    return interpolateOrRd(0.7);
    // return interpolateOrRd(
    //   scale(
    //     tradeData.find(
    //       (item) => item.country2 === feature.properties.sovereignt
    //     )?.value || 0
    //   )
    // );
  }

  if (["RU"].includes(feature.properties.iso_a2)) {
    // return "rgba(206, 50, 50, 1)";
    return "rgba(255,255,255,0.3)";
  }

  if (["IS"].includes(feature.properties.iso_a2)) {
    return "rgba(255, 255, 255, 0.1)";
  }

  return interpolateGreys(
    scale(
      tradeData.find((item) => item.country2 === feature.properties.sovereignt)
        ?.value || 0
    )
  );
}

export default App;
