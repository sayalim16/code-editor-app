import io from "socket.io-client";

let admin =
  "https://core-assessment-dev.pitchnhire.com?user_id=55d4b857-10bb-4cc0-8b55-6d877bdcbc40&level_id=40ab1b0b-7628-4120-976a-9c20f8543f99&username=Test";
let x =
  "https://core-assessment-dev.pitchnhire.com?user_id=8f38289b-7970-4043-ace2-d7dece413098&level_id=40ab1b0b-7628-4120-976a-9c20f8543f99&username=Test";

let url = "https://core-assessment-dev.pitchnhire.com";

let obj:any =  {
  "force new connection": true,
  reconnectionDelay: 10000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: "infinity",
}
const connecter = () => {
  let searchparams = new URLSearchParams(window.location.search);
  let socket = io(
    `${url}?user_id=${searchparams.get("user_id")}&level_id=${searchparams.get(
      "level_id"
    )}&username=${searchparams.get("username")}}`,
    obj
  );
  return socket;
};
const socket = connecter();


export { socket};
