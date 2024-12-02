"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Button from "./../../components/button/Button";
import SpeechRecognition, {
    useSpeechRecognition,
} from "react-speech-recognition";

export default function SubmitMainThread() {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [pilot, setPilot] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [dots, setDots] = useState("");
    const formRef = useRef();
    const [body, setBody] = useState("");
    const bodyRef = useRef("");
    const [showButtons, setShowButtons] = useState(true);
    const [showInnerModal, setShowInnerModal] = useState(false);

    //Use Effect to get the user ID
    useEffect(() => {
        const userID = localStorage.getItem("userID");
        setUserId(userID);
    }, [userId]);

    //Use Effect for the loading dots
    useEffect(() => {
        if (isLoading) {
            const timer = setInterval(() => {
                setDots((dots) => (dots.length < 4 ? dots + "." : ""));
            }, 300);

            return () => clearInterval(timer);
        }
    }, [isLoading]);

    //AI Generate function
    const handleAIGenerate = async (event) => {
        event.preventDefault();
        bodyRef.current = "";
        setBody("");
        setIsLoading(true);
        setShowButtons(false);

        const title = formRef.current.title.value;
        const genre = formRef.current.genre.value;
        const numberOfCharacters = formRef.current.numberOfCharacters.value;

        const endpoint = "/api/openai"; // Serverless function endpoint

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-ratelimit-remaining-requests": 100,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a creative assistant that helps write interesting story openings.",
                    },
                    {
                        role: "user",
                        content: `Given the title: ${title}, genre: ${genre}, and number of main characters: ${numberOfCharacters}, write a paragraph of only three sentences to start the story.`,
                    },
                ],
                temperature: 0.5,
                max_tokens: 300,
            }),
        };

        try {
            const response = await fetch(endpoint, options);
            const data = await response.json();

            if (data.error) {
                console.error("OpenAI API Error:", data.error);
                alert("Error generating text. Please try again.");
                setShowButtons(true);
                setIsLoading(false);
                return;
            }

            const body = data.choices[0].message.content;

            let index = 0;
            const typingTimer = setInterval(() => {
                bodyRef.current = bodyRef.current + body.charAt(index);
                setBody(bodyRef.current);
                index++;

                if (index >= body.length) {
                    clearInterval(typingTimer);
                    setPilot(body);
                    setShowButtons(true);
                }
            }, 10);
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
            setShowButtons(true);
        } finally {
            setIsLoading(false);
        }
    };

    //Thread Submit function
    const handleMainThreadSubmit = async (event) => {
        event.preventDefault();
        let submitConfirm = confirm("Are you ready to submit?");

        if (submitConfirm) {
            const data = {
                title: event.target.title.value,
                genre: [event.target.genre.value],
                pilot: event.target.pilot.value,
                content: {},
                contentBody: event.target.pilot.value,
                phaseStage: {},
                contentBody: event.target.pilot.value,
                mainCharacter: event.target.numberOfCharacters.value,
                tag: "Incomplete",
                likes: 0,
                phase: 1,
                userId: userId,
            };

            const JSONdata = JSON.stringify(data);

            const endpoint = "api/threads/mainThread";

            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSONdata,
            };

            const response = await fetch(endpoint, options);

            const { thread, error } = await response.json();

            if (!error) {
                router.push(`/threads/${thread.id}`);
            }
        } else {
            return;
        }
    };

    //Event handler for voice generated content
    const submitVoice = (e) => {
        e.preventDefault();

        const data = {
            body: e.target.voiceGeneratedContent.value,
        };

        setBody(data.body);
        closeInnerModal();
    };

    //Event handler for the show inner modal
    const InnerModal = ({ setShowInnerModal }) => {
        const {
            transcript,
            listening,
            resetTranscript,
            browserSupportsSpeechRecognition,
            isMicrophoneAvailable,
        } = useSpeechRecognition();

        if (!browserSupportsSpeechRecognition) {
            return <span>Browser doesn't support speech recognition.</span>;
        }

        if (!isMicrophoneAvailable) {
            return <span>Microphone access is needed to begin.</span>;
        }

        return (
            <div className="fixed -top-32 left-0 w-full h-full flex items-center justify-center bg-gray bg-opacity-40 z-40">
                <div className="flex flex-col border-solid border-2 items-center bg-white px-10 pt-3 pb-5">
                    <button
                        onClick={closeInnerModal}
                        type="button"
                        className="text-sm p-1.5 mb-5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg"
                        data-modal-hide="defaultModal"
                    >
                        {" "}
                        <svg
                            aria-hidden="true"
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                        <span className="sr-only"></span>
                    </button>
                    <div className="mb-5">
                        microphone: {listening ? "on" : "off"}
                    </div>
                    <div className="flex flex-row mb-5 justify-evenly">
                        <Button
                            type="button"
                            text="Start"
                            onClick={() =>
                                SpeechRecognition.startListening({
                                    continuous: true,
                                    language: "en-CA",
                                })
                            }
                        ></Button>
                        <Button
                            type="button"
                            text="Stop"
                            onClick={SpeechRecognition.stopListening}
                        ></Button>
                        <Button
                            type="button"
                            text="Reset"
                            onClick={resetTranscript}
                        ></Button>
                    </div>
                    <form className="mx-3" onSubmit={submitVoice}>
                        <label
                            htmlFor="text-input"
                            className="block mb-3 text-md font-mono text-gray-900"
                        >
                            <textarea
                                name="voiceGeneratedContent"
                                id="text-input"
                                rows="10"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                defaultValue={transcript}
                            ></textarea>
                        </label>
                        <div className="flex justify-center py-2">
                            <Button type="submit" text="Submit" />
                        </div>
                    </form>
                </div>
            </div>
        );
    };
    // Event handler for the show inner modal
    const openInnerModal = (e) => {
        e.preventDefault();
        setShowInnerModal(true);
    };
    // Event handler for the close inner modal
    const closeInnerModal = (e) => {
        setShowInnerModal(false);
    };

    return (
        <section>
            <div className="flex px-4 py-4">
                <form
                    ref={formRef}
                    onSubmit={handleMainThreadSubmit}
                    className="w-full"
                >
                    <div className="">
                        <div className="max-w-50 px-3 mb-3">
                            <label className="pl-1 block uppercase tracking-wide text-gray-700 text-xs font-mono mb-2">
                                Title
                                <span
                                    style={{
                                        position: "relative",
                                        bottom: "5px",
                                    }}
                                >
                                    *
                                </span>
                            </label>
                            <input
                                name="title"
                                className="py-3 px-4 mb-2 appearance-none block w-full bg-gray-50 text-gray-700 border rounded leading-tight focus:outline-none focus:bg-white"
                                id="grid-first-name"
                                type="text"
                                placeholder="Title of your story (1 - 100 letters)"
                                pattern=".{1,100}"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-row items-end mb-6">
                        <div className="px-3 flex flex-col">
                            <label className="pl-1 mb-2 block uppercase tracking-wide text-gray-700 font-mono text-xs">
                                Genre
                                <span
                                    style={{
                                        position: "relative",
                                        bottom: "5px",
                                    }}
                                >
                                    *
                                </span>
                            </label>

                            <div className="relative">
                                <select
                                    name="genre"
                                    className="block appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                    id="grid-state"
                                    required
                                >
                                    <option value="">Select</option>
                                    <option>thriller</option>
                                    <option>fantasy</option>
                                    <option>history</option>
                                    <option>horror</option>
                                    <option>crime</option>
                                    <option>romance</option>
                                    <option>psychology</option>
                                    <option>sports</option>
                                    <option>travel</option>
                                    <option>comedy</option>
                                    <option>science-fiction</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg
                                        className="fill-current h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="w-1/3 px-3">
                            <label className="pl-1 mb-2 block uppercase text-gray-700 font-mono text-xs">
                                Number of Characters
                                <span
                                    style={{
                                        position: "relative",
                                        bottom: "5px",
                                    }}
                                >
                                    *
                                </span>
                            </label>
                            <input
                                name="numberOfCharacters"
                                className="appearance-none block w-full bg-gray-50 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                id="grid-zip"
                                type="number"
                                min="1"
                                max="10"
                                placeholder="10"
                                required
                            />
                        </div>
                    </div>

                    <div className="w-full px-3">
                        <label className="pl-1 mb-2 block uppercase tracking-wide text-xs font-mono text-gray-700">
                            Main Story
                            <span
                                style={{ position: "relative", bottom: "5px" }}
                            >
                                *
                            </span>
                        </label>

                        <textarea
                            name="pilot"
                            id="message"
                            rows="9"
                            className="mb-5 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Write your thoughts here..."
                            required
                            value={isLoading ? `Generating text${dots}` : body}
                            onChange={(e) => setBody(e.target.value)}
                            readOnly={isLoading}
                        ></textarea>
                    </div>
                    <div className="flex flex-row justify-between">
                        <div className="px-3">
                            {showButtons && (
                                <Button
                                    text="AI Generate"
                                    onClick={handleAIGenerate}
                                />
                            )}{" "}
                        </div>
                        <div className="mb-2">
                            {showButtons && (
                                <Button
                                    type="button"
                                    text="Voice-to-Text"
                                    onClick={() => setShowInnerModal(true)}
                                />
                            )}
                        </div>
                        <div className="px-3">
                            {showButtons && <Button text="Upload" />}{" "}
                        </div>
                    </div>
                </form>
            </div>
            {showInnerModal && (
                <InnerModal setShowInnerModal={setShowInnerModal} />
            )}
        </section>
    );
}
