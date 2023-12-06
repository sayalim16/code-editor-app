import "./App.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { socket } from "./settings";
import events from "./events";
import Editor from "@monaco-editor/react";


let timeToWait = false;
function EditorComponent() {
  const [users, setUsers] = useState([]);
  const editorRef = useRef(null);
  const customCursorRef = useRef();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  useEffect(() => {
    socket.on(events.connected, (data) => {
      console.log("connected", data);
      if (data?.user_id) {
        // setRoomDetails({
        //   level_id: data?.level_id,
        //   user_id: data?.user_id,
        // });

        // ========== send starting event ==============
        socket.emit(events.liveCollabStart);
      } else {
        toast.success(data ?? "something went wrong.", {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    });

    socket.on("connection-info", (data) => {
      if (data?.type == "connect") {
        toast.success(data?.message, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setUsers((prev) => {
          return [...prev, data?.message?.split(" ")[0]];
        });
      } else if (data?.type == "disconnect") {
        toast.success(data?.message, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setUsers((prev) => {
          return prev.filter((item) => item != data?.message?.split(" ")[0]);
        });
      }
      console.log("connection-info", data);
    });

    socket.on(events.disconnected, (data) => {
      console.log("disconnected", data);
      toast.success(data ?? "something went wrong.", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setUsers((prev) => {
        return prev.filter((item) => item?.startsWith(data.split(" ")[0]));
      });
    });

    // ------------------ received new data ----------------
    socket.on("live-collab", (data) => {
      console.log("live-collab", data);
      if (data?.type == "code-change" || data?.type == "code-sync") {
        if (data?.editor_position && editorRef.current) {
          editorRef?.current.setPosition(data?.editor_position);
          editorRef.current.focus();
        }
        setCode((prev) => data?.code);
      } else if (data?.type == "typing") {
        editorRef.current.focus();
        let cursorDiv = document.querySelector(
          ".monaco-editor .cursors-layer .cursor"
        );
        cursorDiv.setAttribute("data-current-user", data?.message);
        setTimeout(() => {
          cursorDiv.setAttribute("data-current-user", "");
        }, 2000);
      } else if (data?.type == "code-language-change") {
        setLanguage(data?.code_language);
      } else if (data?.type == "mouse-movement") {
        customCursorRef.current.style.display = "inline-block";
        customCursorRef.current.setAttribute("data-name", "ns");
        customCursorRef.current.style.left = data?.mouse_axis?.x + "px";
        customCursorRef.current.style.top = data?.mouse_axis?.y + "px";
        setTimeout(() => {
          customCursorRef.current.style.display = "none";
        }, [2500]);
      }
    });

    return () => {
      socket.off(events.disconnected);
      socket.off(events.connected);
      socket.off(events["live-collab"]);
      socket.off(events["connection-info"]);
    };
  }, []);

  const moveHandler = (a) => {
    if (!timeToWait) {
      timeToWait=true;
      socket.emit("liveCollabMouseMovement", {
        mouse_axis: {
          x: a.pageX,
          y: a.pageY,
        },
      });
      setTimeout(()=>{
        timeToWait= false;
      },[500])
    }
  };

  const handleEditorChange = (value, event) => {
    socket.emit("liveCollabCodeChange", {
      code_body: value,
      editor_position: editorRef?.current?.getPosition(),
    });
  };

  const languageSelector = useCallback(
    (e) => {
      socket.emit("liveCollabCodeLanguageChange", {
        code_language: e.target.value,
      });
      setLanguage((prev) => e.target.value);
    },
    [language]
  );
  // see.add(handleEditorChange)
  //  console.log(see)

  return (
    <div>
      <div className="">
        <select onChange={languageSelector}>
          <option value="javascript" selected={language == "javascript"}>
            Javascript
          </option>
          <option value="python" selected={language == "python"}>
            Python
          </option>
          <option value="c++" selected={language == "c++"}>
            C++
          </option>
          <option value="java" selected={language == "java"}>
            Java
          </option>
        </select>
      </div>
      <div onMouseMove={moveHandler}>
        <Editor
          height="90vh"
          theme="vs-dark"
          defaultLanguage={language}
          defaultValue="// some comment"
          onChange={handleEditorChange}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
          }}
          value={code}
          options={{
            scrollBeyondLastLine: false,
            fontSize: 20,
          }}
        />
      </div>
      {users?.length > 0 &&
        users?.map((item) => {
          return <p key={item}>{item}</p>;
        })}

      <span id={"custom-cursor"} ref={customCursorRef}></span>
      <ToastContainer />
    </div>
  );
}

export default EditorComponent;
