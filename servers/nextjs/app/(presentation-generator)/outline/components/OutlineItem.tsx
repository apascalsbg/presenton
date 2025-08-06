import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Trash2 } from "lucide-react"
import { RootState } from "@/store/store"
import { useDispatch, useSelector } from "react-redux"
import { deleteSlideOutline, setOutlines, SlideOutline } from "@/store/slices/presentationGeneration"
import ToolTip from "@/components/ToolTip"
import MarkdownEditor from "../../components/MarkdownEditor"
import { useEffect } from "react"


interface OutlineItemProps {
    slideOutline: SlideOutline,
    index: number
    isStreaming: boolean
}

export function OutlineItem({
    index,
    slideOutline,
    isStreaming,
}: OutlineItemProps) {
    const {
        outlines,
    } = useSelector((state: RootState) => state.presentationGeneration);
    const dispatch = useDispatch()

    useEffect(() => {
        if (isStreaming && slideOutline.body) {
            const outlineItem = document.getElementById(`outline-item-${index}`);
            if (outlineItem) {
                outlineItem.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                });
            }
        }
    }, [outlines.length]);

    const handleSlideChange = (newOutline: SlideOutline) => {
        if (isStreaming) return;
        const newData = outlines?.map((each, idx) => {
            if (idx === index - 1) {
                return newOutline
            }
            return each;
        });

        if (!newData) return;
        dispatch(setOutlines(newData));
    }


    // DnD sortable configuration
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slideOutline.title || index })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }
    const handleSlideDelete = () => {
        if (isStreaming) return;
        dispatch(deleteSlideOutline({ index: index - 1 }))

    }
    return (
        <div className="mb-2">
            {/* Main Title Row */}
            <div
                ref={setNodeRef}
                style={style}
                className={`flex items-start gap-2 md:gap-4 p-2 sm:pr-4 border border-black/10 bg-purple-100/10 rounded-[8px] ${isDragging ? "opacity-50" : ""}`}
            >
                {/* Drag Handle with Number - Make it smaller on mobile */}
                <div
                    {...attributes}
                    {...listeners}
                    className="min-w-8 sm:min-w-10 w-10 sm:w-14 h-10 sm:h-14 bg-blue-400/10 rounded-[8px] flex items-center justify-center relative cursor-grab"
                >
                    <div className="grid grid-cols-2 gap-[2px]">
                        <div className="w-[3px] h-[3px] bg-black/80 rounded-full" />
                        <div className="w-[3px] h-[3px] bg-black/80 rounded-full" />
                        <div className="w-[3px] h-[3px] bg-black/80 rounded-full" />
                        <div className="w-[3px] h-[3px] bg-black/80 rounded-full" />
                    </div>
                    <span className="text-black/80 text-md sm:text-lg font-medium ml-1">{index}</span>
                </div>

                {/* Main Title Input - Add onFocus handler */}
                <div id={`outline-item-${index}`} className="flex flex-col basis-full gap-2">
                    <input
                        type="text"
                        defaultValue={slideOutline.title || ''}
                        onBlur={(e) => handleSlideChange({ ...slideOutline, title: e.target.value })}
                        className="text-lg mt-4 sm:text-xl flex-1 font-semibold bg-transparent outline-none"
                        placeholder="Title goes here"
                    />

                    {/* Editable Markdown Content */}
                    {isStreaming ? <textarea
                        defaultValue={slideOutline.body || ''}
                        onBlur={(e) => handleSlideChange({ ...slideOutline, body: e.target.value })}
                        className="text-sm  flex-1 font-normal bg-transparent outline-none overflow-y-hidden"
                        placeholder="Content goes here"
                    /> : <MarkdownEditor
                        key={index}
                        content={slideOutline.body || ''}
                        onChange={(content) => handleSlideChange({ ...slideOutline, body: content })}
                    />}

                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 sm:gap-2 items-center">

                    <ToolTip content="Delete Slide">
                        <button
                            onClick={handleSlideDelete}
                            className="p-1.5 sm:p-2 bg-gray-200/50 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-black/70" />
                        </button>
                    </ToolTip>
                </div>
            </div>



        </div>
    )
}

