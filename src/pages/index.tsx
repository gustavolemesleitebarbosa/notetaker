import { type NextPage } from 'next';
import type { Session } from 'next-auth';
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { authOptions } from "~/server/auth";
import { api, type RouterOutputs } from "~/utils/api";


import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { type GetServerSidePropsContext } from 'next';
import { signIn } from 'next-auth/react';
import { Header } from "~/components/Header";
import { generateSSGHelper } from '~/server/helpers/ssgHelper';
import NoteCard from "../components/NoteCard";
import NoteEditor from "../components/NoteEditor";


const override: CSSProperties = {

  borderColor: "blue",
};
type Note = RouterOutputs["note"]["getAll"][0]

export type Props = {
  session: Session | null
}

const Home: NextPage<Props> = ({ session }: Props) => {
  return (
    <>
      <Head>
        <title>NoteTaker</title>
        <meta name="description" content="NoteTaker App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Header session={session} />
        <Content />
      </main>
    </>
  );
};

export default Home;

const Content: React.FC = () => {

  type Topic = RouterOutputs["topic"]["getAll"][0]

  const { data: sessionData, status: sessionStatus } = useSession()
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>()
  const [inputContent, setInputContent] = useState("")

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
    onSuccess(newTopic) {
      setSelectedTopic(newTopic)
    },
    onError: (_err, _newTopic, context) => {
      queryClient.setQueryData([topicsListKey], context?.previousTopics)
    },
    onSettled(_err) {
      void refetchTopics()
    },
  })

  const { data: notes, refetch: refetchNotes } = api.note.getAll.useQuery(
    { topicId: selectedTopic?.id ?? topics?.[0]?.id ?? "" },
    { enabled: sessionData?.user !== undefined }
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

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (topics?.length === 0 && inputRef?.current !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      inputRef.current.focus();
    }
  }, [topics]);

  if (sessionStatus === 'unauthenticated') {
    return <button onClick={() => void signIn()} className="flex items-center justify-center col-span-4 w-full h-[80vh] text-4xl">
      Please sign in
    </button>
  }

  return (
    <div className="mx-5 mt-5 grid grid-cols-1 md:grid-cols-4 gap-2">
      <div className="md:col-span-1 px-2">
        {!isLoading && topics ? (
             <ul className="menu rounded-box w-56 bg-base-100 p-2">
             {
 
               topics.map((topic) => {
                 const isSelected = topic.id === selectedTopic?.id
                 return (
                   <li key={topic.id}>
                     <a
                       className={`${isSelected ? 'bg-sky-100' : ''}`}
                       href="#"
                       onClick={(evt) => {
                         evt.preventDefault();
                         setSelectedTopic(topic);
                       }}
                     >
                       {topic.title}
                     </a>
                   </li>)
               }
               )
             }
           </ul>
        ) : (
          <>{'Loading topics...'}</>
        )}
        <div className="divider"></div>
        <div className="relative">
          <div className="relative left-4 top-10">
            {topics?.length === 0 && inputContent === "" && (
              <span className="absolute flex w-8 h-8 right-0 bottom-7 z-1900">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative top-2 left-2 inline-flex rounded-full h-4 w-4 bg-sky-500"></span>
              </span>
            )}
          </div>
          <div className='flex'>
            <input
              type="text"
              placeholder="New Topic"
              ref={inputRef}
              onChange={(e) => {
                setInputContent(e.target.value);
              }}
              className={`input-bordered input input-md w-full ${topics?.length === 0 && inputContent === ""
                ? "border-black-500"
                : ""
                }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createTopic.mutate({
                    title: e.currentTarget.value,
                  });
                  e.currentTarget.value = "";
                }
              }
              }
            />
            <button
              onClick={() => {
                createTopic.mutate({
                  title: inputContent,
                });
                if(inputRef?.current !== null){
                   inputRef.current.value = "";
                }
              }}
              className="btn-primary btn ml-2 h-2 md:hidden lg:hidden"
              disabled={inputContent === ""}
            >
              Add
            </button>
          </div>
        </div>
      </div>
      {topics && topics?.length > 0 ? (
        <div className="md:col-span-3">
          <div>
            {notes?.map((note) => (
              <div key={note.id} className="mt-5">
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
              });
            }}
          />
        </div>
      ) : (
        <div className="md:col-span-3 text-align: center">
          {topics?.length === 0 && inputContent === '' &&
            <div className="w-full h-[35vh] flex flex-col flex-wrap justify-center items-center md:text-4xl lg:text-4xl">
              <div className="mb-5 text-center">You have no topics yet.😔</div>
              <div className="text-center mb-5">
                Please enter your first topic on the input
              </div>
            </div>
          }
        </div>
      )}
    </div>
  )
}


export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions)
  const ssg = generateSSGHelper(session);
  // const id = context.params?.id as string;
  /*
   * Prefetching the `post.byId` query here.
   * `prefetch` does not return the result and never throws - if you need that behavior, use `fetch` instead.
   */
  let notes = null
  if (session) {
    const topics = await ssg.topic.getAll.fetch();
    if (topics.length && topics[0]) {
      notes = await ssg.note.getAll.fetch({ topicId: topics[0].id });
      // Make sure to return { props: { trpcState: ssg.dehydrate() } }
      notes = notes.map(note => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString()
      }));
    }
  }

  return {
    props: {
      trpcState: ssg.dehydrate(),
      session
    },
  };
}

