import logo from './ive_icon.png';
import './App.css';
import { useEffect, useState, CSSProperties } from "react";
import cookie from 'react-cookies'
import { ClipLoader } from "react-spinners";
import axios from 'axios';

const override/*: CSSProperties*/ = {
  display: "block",
  margin: "0 auto",
  // borderColor: "red",
};


function App() {
  //global=============================================================================
  function nomal(element) {
    return document.createElement(element);
  }
  const minlim = 15;
  const maxlim = 120;
  const time_step = 15;
  var display_time = 15;
  const FirstTime = 0;
  const InQueue = 1;
  const InUse = 2;
  const Finish = 3;
  const not_this_user = 4;
  let [carNum, setcarNum] = useState("");



  let interval;

  const API_BASE_URL = 'https://carparktest3backend.onrender.com';
  // const API_BASE_URL = `http://${window.location.hostname}:7000`;
  const backend = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
  });

  async function getMongo_userState(_carNum) {  //defrontation
    console.log("_carNum" + _carNum)
    try {
      let output = []
      //不能在此行獲取carNum_response 因為carNum_response 未出現
      const carNum_response = await backend.get("/", {         //發送網絡請求到backend果個係backend.get
        params: {
          'Parking Space Num': _carNum,  //send request to backend搵同自己一樣ga野 ===>呢句係filter
          _id: `"${cookie.load("_id")}"`
        }
      });
      console.log(carNum_response)
      console.log(carNum_response.data);  //index.js 果邊便既resp.send ==>(response.send) 既(rows)

      return carNum_response.data
    } catch (error) {
      console.error('Error fetching data: ', error);
      throw error;
    }
  }

  function millis_to_time_String(durationInMillis) {
    let millis = durationInMillis % 1000;
    let second = (durationInMillis / 1000) % 60;
    let minute = (durationInMillis / (1000 * 60))
    let time = `${Math.floor(minute)}分鐘 ${Math.floor(second)}秒`;
    return time
  }
  let useEffect_lock = false;
  let eventSource = void 0;
  let eventMTloop = void 0;
  let dont_reload = false;
  let last_useEffect = 0;

  function after_useEffect() {
    if (useEffect_lock) {
      function eventMT() {
        console.log(millis_to_time_String(Date.now() - last_useEffect))
        if (cookie.load("_id") === void 0 && Date.now() - last_useEffect < 1500) return;
        else clearInterval(eventMTloop);
        eventSource = new EventSource(`${API_BASE_URL}/events?_id="${cookie.load("_id")}"`);
        console.log("eventSource", eventSource);
        eventSource.onmessage = (event) => {
          const data = (event.data);
          console.log('接收到事件:', event.type);
          console.log('接收到事件數據:', data);
          console.log("exception:", data.exception)
          if ((
            (document.getElementById("SelectChargingTime")
              && document.getElementById("SelectChargingTime").style.display == "none")
            || (document.getElementById("confirmBtn")
              && document.getElementById("confirmBtn").style.display == "none")
          )
            &&
            document.getElementById("ExistingUsing_stop_btn")
            && document.getElementById('ExistingUsing_stop_btn').style.display == ''
            &&
            document.getElementById("cancelbtn")
            && document.getElementById("cancelbtn").style.display == ""
            // !dont_reload
          ) {
            console.log(event.data);
            console.log(event.data == "reload");
            console.log(event.data == "fetchData");
            if (event.data == "reload") {
              console.log("reload");
              redirectToNextPage();
            }
            if (event.data == "fetchData") {
              console.log("fetchData");
              fetchData();
            }
          } else
            console.log(
              `don't reload
            ${document.getElementById("SelectChargingTime")}
            &&${document.getElementById("SelectChargingTime").style.display == "none"}
            &&
            ${document.getElementById("ExistingUsing_stop_btn")}
            &&${document.getElementById('ExistingUsing_stop_btn').style.display == ''}
            &&
            ${document.getElementById("cancelbtn")}
            &&${document.getElementById("cancelbtn").style.display == ""}
              `
            );
        };

      }
      eventMTloop = setInterval(eventMT, 500);
      last_useEffect = Date.now()
      window.onbeforeunload = function () {
        if (
          document.getElementById("welcome")
          && document.getElementById("welcome").style.display != "none"
        )
          // cookie.remove("_id");
          ;
      }


      return;
    }
  }



  let fetchData = void 0;
  useEffect(() => {
    if (useEffect_lock) return;
    useEffect_lock = true; console.log(useEffect_lock);
    console.log("useEffect");
    document.getElementById("loading繼續").style.height = document.getElementById("after_cookie").style.height;
    console.log(document.getElementById("after_cookie").style)
    for (let i = 1; i < 12; i++) console.log(window.location.host + "/" + btoa(i));
    console.log(window.location.pathname);
    const carNum_base64 = window.location.pathname.substring(1);  //假設是1號車位 ==> window.location.pathname的內容是 "/MQ=="
    console.log(carNum_base64);
    setcarNum(atob(carNum_base64));  // your car park is no. (1-11) 
    document.title = `Parking Space ${atob(carNum_base64)}`;  //React title display parking space X
    const react_def_app = document.getElementById("react_def_app");
    react_def_app.style.display = "none";
    const SelectChargingTime = document.getElementById("SelectChargingTime");
    SelectChargingTime.style.display = "none";  //"none" = do not display ; "block" = display ; "" = display
    let queue_endtime = undefined;
    let charge_endtime = undefined;
    fetchData = () => {     //定義 ===> 
      console.log("atob(carNum_base64)=" + atob(carNum_base64))
      getMongo_userState(atob(carNum_base64))  //執行getMongo_userState  ===> 判斷user ga state 返回promise 一旦呢個promise完成 就會執行.then入面ga野(即第一個param) ==>第一個param 即係116-152行
        .then(async (params) => {
          setcarNum(params[3]);
          const user_State = params[0];
          console.log(user_State);
          console.log(params);
          const SelectChargingTime = document.getElementById("SelectChargingTime");
          SelectChargingTime.style.display = "none";  //"none" = do not display ; "block" = display ; "" = display
          if (user_State != FirstTime) {
            console.log("user_State != FirstTime")
            const welcome = document.getElementById("welcome");
            welcome.style.display = "none";
          } else {
            const welcome = document.getElementById("welcome");
            welcome.style.display = "";
            console.log("FirstTime");
            console.log(params)
            console.log(params[0])
            console.log(params[1])
            console.log(params[2])
            document.getElementById("There are x in front").innerHTML = params[1] - 1;
            //document.getElementById("You need to wait x minutes").innerHTML = millis_to_time_String(params[2]< 0?0:params[2]);  //用:分隔 ===>  condtion ? ture : false
            //document.getElementById("You need to wait x minutes").innerHTML = millis_to_time_String(params[2] - new Date(Date.now()).getTime());   // millis_to_time_String(params[2]) 呢嚿係未來ga時間 轉左做有字個樣 (所謂有字個樣即係有分鐘，有秒咁解)
            const time = (params[2] - new Date(Date.now()).getTime())
            console.log(`(${params[2]} - ${new Date(Date.now()).getTime()})`)
            document.getElementById("You need to wait x minutes").innerHTML = millis_to_time_String(time < 0 ? 0 : time)   //用:分隔 ===>  condtion is before ?  ture : false
            queue_endtime = (params[2]);   //裝住params[2]入面既值

            console.log(cookie.load("_id"))
            console.log(cookie.load("_id") === undefined)
            if (cookie.load("_id") === undefined) {
              const carNum_base64 = window.location.pathname.substring(1);
              const response = await backend.post("/register", null,
                {
                  params: {
                    'Parking Space Num': atob(carNum_base64),
                    // 'charge duration': document.getElementById("charging-time").innerHTML,
                  }
                }
              );
              console.log(response);
              const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
              console.log(expires)
              console.log(window.location.host)
              cookie.save(
                '_id',
                response.data,
                {
                  path: '/',
                  expires,
                  // domain: window.location.host,
                  // secure: true,
                  // httpOnly: true,
                })
              console.log(cookie.load("_id"))
            }
          }
          if (user_State != InQueue) {
            console.log("user_State != InQueue")
            const Queuing = document.getElementById("Queuing");
            Queuing.style.display = "none";
          } else {
            const Queuing = document.getElementById("Queuing");
            Queuing.style.display = "";
            console.log("InQueue");
            document.getElementById("You are in ranking X").innerHTML = params[1];
            // document.getElementById("There are x minutes left to start charging").innerHTML = millis_to_time_String(params[2]< 0?0:params[2]); //用:分隔 ===>  condtion ? ture : false
            const time = (params[2] - new Date(Date.now()).getTime())
            //document.getElementById("There are x minutes left to start charging").innerHTML = millis_to_time_String(params[2] - new Date(Date.now()).getTime());   // millis_to_time_String(params[2]) 呢嚿係未來ga時間 轉左做有字個樣 (所謂有字個樣即係有分鐘，有秒咁解)
            if (params[1] == 1 && params[4] && Date.now() < params[4]) {
              const moveing_time = (params[4] - new Date(Date.now()).getTime())
              document.getElementById("There are x minutes left to start charging").innerHTML = millis_to_time_String(moveing_time < 0 ? 0 : moveing_time)
              queue_endtime = (params[4]);
              document.getElementById("InQueue_state_text").innerHTML = "移動中";
              document.getElementById("your_queue_num_text").style.display = "none";
              document.getElementById("You are in ranking X").style.display = "none";
              document.getElementById("waitting_time_has").style.display = "none";
              document.getElementById("Remaining time moving to").style.display = "";
            } else {
              document.getElementById("There are x minutes left to start charging").innerHTML = millis_to_time_String(time < 0 ? 0 : time)
              queue_endtime = (params[2]);
            }
          }
          if (user_State != InUse) {
            console.log("user_State != InUse")
            const ExistingUsing = document.getElementById("ExistingUsing");
            ExistingUsing.style.display = "none";
          } else {
            const ExistingUsing = document.getElementById("ExistingUsing");
            ExistingUsing.style.display = "";
            console.log("InUse");
            console.log(params);
            charge_endtime = (params[1]);
            document.getElementById("Remaining time").innerHTML = millis_to_time_String(charge_endtime - new Date(Date.now()).getTime());   // new Date(Date.now()).getTime ==> 而家嘅時間 ; [start (charging) time + charge duration] = charge_endtime ==> charge_endtime - new date(Date.now()).getTime = charge remaining time
          }
          if (user_State != Finish) {
            console.log("user_State != Finish")
            const FinishCharging = document.getElementById("FinishCharging");
            FinishCharging.style.display = "none";
          } else {
            const FinishCharging = document.getElementById("FinishCharging");
            FinishCharging.style.display = "";
            console.log("Finish")
            cookie.remove("_id")
          }
          if (user_State != not_this_user) {
            console.log(not_this_user)
            const NotYou = document.getElementById("NotYou");
            NotYou.style.display = "none";
          } else {
            const NotYou = document.getElementById("NotYou");
            NotYou.style.display = "";


          }

          document.getElementById("_id").innerHTML = cookie.load("_id") || "no _id";
          document.getElementById("loading繼續").style.display = "none";
          document.getElementById("after_cookie").style.display = "";
        });
    };

    fetchData();  //執行

    // Set up interval for countdown
    //if (true)
    let countdown_loop = () => { console.warn("empty countdown_loop") }
    interval = setInterval(countdown_loop, 0);
    clearInterval(interval);
    let fetched = false;
    countdown_loop = () => {
      if (charge_endtime && charge_endtime > 0) {
        const newTime = charge_endtime - new Date(Date.now()).getTime();
        if (newTime <= 0) {
          // redirectToNextPage()
        }
        if (document.getElementById("Remaining time")) {    //Remaining time 係 ExistingUsing入面 ga 野
          //document.getElementById("Remaining time").innerHTML = millis_to_time_String(newTime);
          document.getElementById("Remaining time").innerHTML = millis_to_time_String(newTime < 0 ? 0 : newTime);
        }
      }
      const newTime = queue_endtime - new Date(Date.now()).getTime();  //queue_endtime=排完隊嘅時間 ; queue_time - nowTime = 距離開始充電時間
      if (document.getElementById("There are x minutes left to start charging")) {
        if (newTime && newTime > 0)
          document.getElementById("There are x minutes left to start charging").innerHTML = millis_to_time_String(newTime);
        else document.getElementById("There are x minutes left to start charging").innerHTML = millis_to_time_String(0);
      }
      if (document.getElementById("You need to wait x minutes")) {
        if (newTime && newTime > 0)
          document.getElementById("You need to wait x minutes").innerHTML = millis_to_time_String(newTime);
        else document.getElementById("You need to wait x minutes").innerHTML = millis_to_time_String(0);
      }
      if (newTime && newTime < 0 && cookie.load("_id")) {   //if 倒數為0min 0sec 會去database check 資料
        // console.log(cookie.load("_id"));
        if ((
          (document.getElementById("SelectChargingTime")
            && document.getElementById("SelectChargingTime").style.display == "none")
          || (document.getElementById("confirmBtn")
            && document.getElementById("confirmBtn").style.display == "none")
        )
          &&
          document.getElementById("ExistingUsing_stop_btn")
          && document.getElementById('ExistingUsing_stop_btn').style.display == ''
          &&
          document.getElementById("cancelbtn")
          && document.getElementById("cancelbtn").style.display == ""
          // !dont_reload
        ) {
          if (!fetched) {
            console.log("fetchData");
            fetchData();
          }
          fetched = true;
        } else
          console.log(
            `don't fetchData
            ${document.getElementById("SelectChargingTime")}
            &&${document.getElementById("SelectChargingTime").style.display == "none"}
            &&
            ${document.getElementById("ExistingUsing_stop_btn")}
            &&${document.getElementById('ExistingUsing_stop_btn').style.display == ''}
            &&
            ${document.getElementById("cancelbtn")}
            &&${document.getElementById("cancelbtn").style.display == ""}
              `
          );
        // clearInterval(interval);
      }
      //queue_endtime = newTime;
      //return 0;

      console.log("interval")
      //clearInterval(interval)
      // Optionally refresh data from backend periodically
      //fetchData();
    }
    interval = setInterval(countdown_loop, 1000);
    document.getElementById("confirmText").style.display = "none";
    document.getElementById("confirmButtons").style.display = "none";
    document.getElementById("chargingStopped").style.display = "none";
    document.getElementById("thankYouMsg").style.display = "none";
    document.getElementById("chargingStopped").style.color = "white";
    document.getElementById("thankYouMsg").style.color = "white";

    updateTotalPrice();
    after_useEffect();
    // Cleanup interval on component unmount
    return () => {
      try { if (eventSource !== void 0) eventSource.close(); }
      catch { };
      // clearInterval(interval);
    };
  }, []);

  function goto(v) {
    return (a) => {
      console.log(a);
      for (let i = 0; i < arguments.length; i++) {
        v = arguments[i];
        console.log(v);
        const target = document.getElementById(v);
        if (target != null) target.style.display = '';
        else {
          document.getElementById("react_def_app").style.display = '';
          return
        }
      }
      let crr = a.currentTarget;
      console.log(crr);
      console.log(crr.parentNode);
      let count = 0
      while (crr.tagName.indexOf("TOP") < 0) {
        if (crr.parentNode != null)
          crr = crr.parentNode;
        else break;
        count++;
      }
      console.log(count);
      console.log(crr);
      crr.style.display = "none";
    }
  }

  //SelectChargingTime---------------------------------------------
  const updateTotalPrice = () => {
    const totalPrice = document.getElementById('total-price');
    const chargingTimeSelect = document.getElementById('charging-time');
    const chargingTime = parseInt(chargingTimeSelect.innerHTML);
    const price = chargingTime / 15 * 5;
    totalPrice.textContent = `充電${chargingTime}分鐘，總費用為${price}元。`;
  };

  function increasetimeBtn(e) {
    console.log("add_time")
    console.log(display_time)
    if (display_time < maxlim)
      display_time += 15;
    console.log(display_time)
    const chargingTimeSelect = document.getElementById('charging-time');
    console.log(chargingTimeSelect)
    chargingTimeSelect.innerHTML = display_time;
    updateTotalPrice();
  }

  function decreasetimeBtn(e) {
    console.log("sub_time")
    if (display_time > minlim)
      display_time -= 15;
    //console.log("sub_time")

    const chargingTimeSelect = document.getElementById('charging-time');
    chargingTimeSelect.innerHTML = display_time;
    updateTotalPrice();
  }

  async function confirmPayment() {
    document.getElementById("confirmBtn").style.display = "none";
    const carNum_base64 = window.location.pathname.substring(1);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    console.log(expires)
    console.log(window.location.host)
    cookie.save(
      '_id',
      cookie.load("_id"),
      {
        path: '/',
        expires,
        // domain: window.location.host,
        // secure: true,
        // httpOnly: true,
      })
    const response = await backend.post("/selected", null,
      {
        params: {
          '_id': cookie.load('_id'),
          'Parking Space Num': atob(carNum_base64),
          'charge duration': document.getElementById("charging-time").innerHTML,
        }
      }
    );
    console.log(response);
    //cookie.save('_id', response.data, { path: '/' })
    //alert(cookie.load('_id'));
    // redirectToNextPage()
  }

  function redirectToNextPage() {
    // 在這裏添加轉落下一頁的邏輯，可以使用 window.location.href = '下一頁的URL';
    // alert('轉落下一頁');
    console.log(`/${btoa(atob(window.location.pathname.substring(1)))}`)
    console.log(window.location.pathname.substring(1))
    window.location.href = `/${btoa(atob(window.location.pathname.substring(1)))}`
  }

  //Queuing------------------------------------------------------
  function showMessage(isConfirmed) {
    return async () => {
      const cancel_show = document.getElementById("cancel_show");
      const infoRow = document.getElementById("infoRow");
      if (isConfirmed) {  //press yes, need to update db
        // dont_reload=true;
        // console.log("showMessage, set dont_reload="+dont_reload);
        infoRow.style.display = "none";
        const cancal_response = await backend.post("/cancal", null, {
          params: {
            "_id": cookie.load('_id')   // this is filter
          }
        });
        console.log(cancal_response);
        cookie.remove('_id')
        document.getElementById('message').textContent = "請拔除充電接收器，謝謝!";
      }
      else {
        const cancelbtn = document.getElementById("cancelbtn");
        const samplebtn = document.getElementById("samplebtn");
        cancelbtn.style = samplebtn.style;
      }
      cancel_show.style.display = "none";
      document.getElementById('message').style.display = '';
    }
  }

  function cancel() {
    return () => {
      const cancel_show = document.getElementById("cancel_show");
      const cancelbtn = document.getElementById("cancelbtn");
      cancel_show.style.display = "";
      cancelbtn.style.display = "none";
    }
  }

  //ExistingUsing------------------------------------------------
  function confirmStop() {
    return () => {
      document.getElementById('confirmText').style.display = '';
      document.getElementById('confirmButtons').style.display = '';
      document.getElementById('ExistingUsing_stop_btn').style.display = 'none';
      document.getElementById('chargingTime').style.display = 'none';
    }
  }

  function stopCharging() {  //撳左"是"會執行
    return async () => {
      // dont_reload = true;
      // console.log("stopCharging, set dont_reload="+dont_reload);
      document.getElementById('confirmText').style.display = 'none';
      document.getElementById('confirmButtons').style.display = 'none';
      const cancal_response = await backend.post("/cancal", null, {
        params: {
          "_id": cookie.load('_id')   // this is filter
        }
      });
      console.log(cancal_response);
      cookie.remove("_id")
      document.getElementById('chargingStopped').style.display = '';
      document.getElementById('thankYouMsg').style.display = '';
    }
  }

  function cancelStop() {
    return () => {
      document.getElementById('confirmText').style.display = 'none';
      document.getElementById('confirmButtons').style.display = 'none';
      document.getElementById('ExistingUsing_stop_btn').style.display = '';
      document.getElementById('chargingTime').style.display = '';
    }
  }

  //FinishCharging------------------------------------------------


  //html----------------------------------------
  return (
    <div className="App">
      <header className="App-header">
        <p id="_id" style={{ display: "none" }}>loading</p>
        {/* <p id="_id" >loading</p> */}
        <div-top id="react_def_app" style={{ display: "none" }}>
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </div-top>
        <div-top id="welcome" style={{ display: "none" }}>
          <h1>歡迎</h1>
          <div class="info">{carNum}號車位</div>
          <div>
            <table class="center">
              <tbody>
                <tr>
                  <td>前面有</td>
                  <td><p id="There are x in front">X</p></td>
                  <td>個</td>
                  <td style={{ padding: 10 + "px" }}></td>
                  <td>你要等</td>
                  <td><p id="You need to wait x minutes">X</p></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <button id="after_cookie" onClick={goto("SelectChargingTime")} style={{ display: "none" }}>繼續</button>
            <div id="loading繼續">
              <ClipLoader
                color="#ff00ba"
                loading={true}
                cssOverride={override}
                size={64}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            </div>
          </div>
        </div-top>
        <div-top id="SelectChargingTime" style={{ display: "none" }}>
          <h1>全香港最平嘅室內停車場</h1>
          <div id="parking-spots">
            <div class="parking-spot" data-spot="X">{carNum}號車位</div>
          </div>
          <div id="charging-options">
            <table class="center">
              <tbody>
                <tr>
                  <td>充電時間:</td>
                  <td><p id="charging-time">15</p></td>
                  <td>(分鐘)</td>
                </tr>
              </tbody>
            </table>
            <button style={{ marginRight: 50 + 'px' }} class="sym" onClick={decreasetimeBtn}>-</button>
            <button style={{ marginLeft: 50 + 'px' }} class="sym" onClick={increasetimeBtn}>+</button>
            <p></p>
            <p id="total-price"></p>
            <button id="confirmBtn" onClick={confirmPayment}>確定</button>

          </div>
        </div-top>
        <div-top id="Queuing" style={{ display: "none" }}>
          <h1>全香港最平嘅室內停車場</h1>
          <div class="info">{carNum}號車位</div>
          <table class="center">
            <tr>
              <td id="InQueue_state_text" colspan="6">排隊中</td>
            </tr>
            <tr id="infoRow">
              <td id="your_queue_num_text">你排第</td>
              <td><p id="You are in ranking X">X</p></td>
              {/* <td>個</td> */}
              <td style={{ padding: 10 + "px" }}></td>
              <td id="waitting_time_has">距離開始充電時間還有</td>
              <td id="Remaining time moving to" style={{ display: "none" }}>充電器行駛到閣下的車位需時</td>
              <td><p id="There are x minutes left to start charging">X</p></td>
            </tr>
          </table>
          <button id="cancelbtn" onClick={cancel()}>取消</button>
          <div id="cancel_show" style={{ display: "none" }}>
            <p>你確定要取消輪候充電?</p>
            <button onClick={showMessage(true)}>是</button>
            <button onClick={showMessage(false)} id="samplebtn">否</button>
          </div>
          <p id="message" style={{ display: "none" }}></p>
        </div-top>
        <div-top id="ExistingUsing" style={{ display: "none" }}>
          <h1>全香港最平嘅室內停車場</h1>
          <div class="info">{carNum}號車位</div>
          <table id="chargingTime" class="center">
            <tr>
              <td colspan="2">充電中</td>
            </tr>
            <tr>
              <td>閣下的充電時間剩餘</td>
              <td><p id="Remaining time">X</p></td>
            </tr>
          </table>
          <button id="ExistingUsing_stop_btn" onClick={confirmStop()} class="btn">停止</button>
          <p id="confirmText" style={{ display: "none" }}>你確定要停止充電嗎?</p>
          <div id="confirmButtons" style={{ display: "none" }}>
            <button class="yesBtn" onClick={stopCharging()}>是</button>
            <button class="noBtn" onClick={cancelStop()}>否</button>
          </div>
          <p id="chargingStopped" style={{ display: "none" }}>充電已停止</p>
          <p id="thankYouMsg" style={{ display: "none" }}>感謝閣下使用，請拔除充電接收器，謝謝！</p>
        </div-top>
        <div-top id="FinishCharging" style={{ display: "none" }}>
          <h1>全香港最平嘅室內停車場</h1>
          <div class="info">{carNum}號車位</div>
          <p>充電已完成</p>
          <p>感謝閣下使用，請拔除充電接收器，謝謝!</p>
        </div-top>
        <div-top id="NotYou" style={{ display: "none" }}>
          <h1>全香港最平嘅室內停車場</h1>
          <div class="info">{carNum}號車位</div>
          <p>此車位已經有其他使用者使用!</p>
        </div-top>
      </header>
    </div>
  );
}

export default App;