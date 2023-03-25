import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import React, { useState, type CSSProperties } from "react";
import { api, type RouterOutputs } from "~/utils/api";

import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from '@trpc/react-query';
import ClipLoader from "react-spinners/ClipLoader";
import { Header } from "~/components/Header";
import NoteCard from "~/components/NoteCard";
import NoteEditor from "~/components/NoteEditor";

const override: CSSProperties = {

  borderColor: "blue",
};

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>NoteTaker</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Header />
        <Content />
      </main>
    </>
  );
};

export default Home;

const Content: React.FC = () => {

  type Topic = RouterOutputs["topic"]["getAll"][0]
  type Note = RouterOutputs["note"]["getAll"][0]

  const { data: sessionData, status: sessionStatus } = useSession()
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const { data: topics, refetch: refetchTopics, isLoading } = api.topic.getAll.useQuery(
    undefined,
    {
      enabled: sessionData?.user !== undefined,
      onSuccess: (data) => { setSelectedTopic(selectedTopic ?? data[0] ?? null) }
    }
  );

  const topicsListKey = getQueryKey(api.topic.getAll, undefined, 'query');

  const queryClient = useQueryClient()

  const createTopic = api.topic.create.useMutation({
    onMutate: async (newTopic) => {
      await queryClient.cancelQueries({ queryKey: topicsListKey })

      // get the cached values of 'topics'
      const previousTopics: Topic[] | undefined = queryClient.getQueryData(topicsListKey);

      // set the cached data with an added object
      // i.e the new topic posted

      queryClient.setQueryData(
        topicsListKey,
        previousTopics ? [...previousTopics, { title: newTopic.title, }] : [[], { title: newTopic.title, }]
      );
      return { previousTopics }
    },
    onError: (_err, _newTopic, context) => {
      queryClient.setQueryData([topicsListKey], context?.previousTopics)
    },
    onSettled() {
      void refetchTopics()
    },
  })

  const { data: notes, refetch: refetchNotes } = api.note.getAll.useQuery(
    { topicId: selectedTopic?.id ?? "" },
    { enabled: sessionData?.user !== undefined && selectedTopic !== null }
  )

  const notesListKey = getQueryKey(api.note.getAll, { topicId: selectedTopic?.id ?? "" }, 'query');
  const createNote = api.note.create.useMutation({
    onMutate: async (newNote) => {

      await queryClient.cancelQueries({ queryKey: notesListKey })

      // get the cached values of 'topics'
      const previousNotes: Note[] | undefined = queryClient.getQueryData(notesListKey);

      // set the cached data with an added object
      // i.e the new note posted

      queryClient.setQueryData(
        notesListKey,
        previousNotes ? [...previousNotes, { title: newNote.title, content: newNote.content }] : [[], { title: newNote.title, }]
      );
      // return previousValue here 
      // we will use it in the next section
      return { previousNotes }
    },
    onError: (_err, _newNote, context) => {
      queryClient.setQueryData([notesListKey], context?.previousNotes)
    },
    onSettled: () => {
      void refetchNotes()
    },
  })

  const deleteNote = api.note.delete.useMutation({
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: notesListKey })
      // get the cached values of 'topics'
      const previousNotes: Note[] | undefined = queryClient.getQueryData(notesListKey);

      // set the cached data with an added object
      // i.e the new note posted
      if (previousNotes)
        queryClient.setQueryData(
          notesListKey,
          [...previousNotes.filter(note => note.id !== newNote.id)]
        );
      return { previousNotes }
    },
    onError: (_err, _newNote, context) => {
      queryClient.setQueryData([notesListKey], context?.previousNotes)
    },
    onSettled: () => {
      void refetchNotes()
    }
  })

  return (
    <div className="mx-5 mt-5 grid grid-cols-4 gap-2">
      {
        sessionStatus === 'loading' ?
          <div className="flex items-center justify-center col-span-4 h-[80vh]">
            <ClipLoader
              color={"##0679FE"}
              loading={true}
              cssOverride={override}
              size={150}
            />
          </div> :
          <>
            <div className="px-2">
              {!isLoading && topics ?
                <ul className="menu rounded-box w-56 bg-base-100 p-2">
                  {topics?.map((topic) => (
                    <li key={topic.id}>
                      <a href="#" onClick={(evt) => {
                        evt.preventDefault();
                        setSelectedTopic(topic)
                      }}>
                        {topic.title}
                      </a>
                    </li>
                  ))}
                </ul> : <> Loading topics...</>
              }
              <div className="divider"></div>
              <input
                type="text"
                placeholder="New Topic"
                className="input-bordered input input-sm w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createTopic.mutate({
                      title: e.currentTarget.value,
                    })
                    e.currentTarget.value = ""
                  }
                }}
              />
            </div>
            <div className="col-span-3">
              <div>
                {notes?.map((note) => (
                  <div key={note.id} className=" mt-5">
                    <NoteCard
                      note={note}
                      onDelete={() => void deleteNote.mutate({ id: note.id })}
                    />
                  </div>
                ))}
              </div>
              <NoteEditor
                onSave={({ title, content }) => {
                  void createNote.mutate({
                    title,
                    content,
                    topicId: selectedTopic?.id ?? "",
                  })
                }}
              />
            </div>
          </>
      }
    </div>
  )
}