// State graph for client:
//               start --||<-----------------------||
//                       ||                      on close
//                       \/                        ||
//                      init -- send name ----> chat room ----||
//                                                 /\    send/receive
//                                                 ||         ||
//                                                 ||         \/
//                                                 ||----------

function enterInit() {
    document.getElementById("login").hidden = false;
    document.getElementById("login").onsubmit = function () {
        var loginMsg = document.getElementById("login-msg");

        if (loginMsg.value.trim() === "") {
            return false;
        }

        if (window["WebSocket"]) {
            document.getElementById("login").hidden = true;
            enterChatRoom(loginMsg.value.trim());
        } else {
            alert("Your browser does not support WebSockets.");
        }

        return false;
    };
}

function enterChatRoom(name) {
    function appendLog(item) {
        var doScroll = log.scrollTop > log.scrollHeight - log.clientHeight - 1;
        log.appendChild(item);
        if (doScroll) {
            log.scrollTop = log.scrollHeight - log.clientHeight;
        }
    }

    document.getElementById("log-container").hidden = false;
    var conn = new WebSocket("ws://" + document.location.host + "/ws");
    conn.onopen = function (event) {
        conn.send(name);

        conn.onmessage = function (evt) {
            var messages = evt.data.split('\n');
            for (var i = 0; i < messages.length; i++) {
                var item = document.createElement("div");
                item.innerText = messages[i];
                appendLog(item);
            }
        };

        document.getElementById("form").onsubmit = function () {
            if (!conn) {
                return false;
            }
            if (!msg.value) {
                return false;
            }
            conn.send(msg.value);
            msg.value = "";
            return false;
        };

        return false;
    }

    conn.onclose = function (evt) {
        var item = document.createElement("div");
        item.innerHTML = "<b>Connection closed.</b>";
        appendLog(item);
        document.getElementById("log-container").hidden = true;
        enterInit();
    };
}

window.onload = function () {
    this.enterInit();
}