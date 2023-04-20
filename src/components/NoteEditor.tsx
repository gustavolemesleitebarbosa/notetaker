import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from '@codemirror/language-data';
import CodeMirror from "@uiw/react-codemirror";
import { useState } from 'react';
type Props = {
  onSave: (note: { title: string; content: string }) => void
}

const NoteEditor = ({ onSave }: Props) => {
  const [code, setCode] = useState<string>("")
  const [title, setTitle] = useState<string>("")
  return (
    <div className='card mt-5 border border-gray-200 bg-base-100 shadow-xl' >
      <div className='card-body'>
        <h2 className='card-title'>
          <input
            type="text"
            placeholder="Note title"
            className="input-primary input input-lg w-full font-bold"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
        </h2>
        <CodeMirror
          placeholder={"Type some markdown code  here..."}
          value={code}
          height="30vh"
          minWidth="100%"
          minHeight="10vh"
          extensions={[
            markdown({ base: markdownLanguage, codeLanguages: languages }),
          ]}
          onChange={(value) => setCode(value)}
          className="border border-gray-300"
        />
      </div>
      <button
        onClick={() => {
          onSave({
            title,
            content: code,
          });
          setCode("");
          setTitle("");
        }}
        className="btn-primary btn"
        disabled={title.trim().length === 0 || code.trim().length === 0}
      >
        Save
      </button>
    </div>
  )
}

export default NoteEditor