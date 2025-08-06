import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { arrayMove } from "@dnd-kit/sortable";
import { setOutlines, SlideOutline } from "@/store/slices/presentationGeneration";

export const useOutlineManagement = (outlines: SlideOutline[] | null) => {
  const dispatch = useDispatch();

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (!active || !over || !outlines) return;

    if (active.id !== over.id) {
      const oldIndex = outlines.findIndex((item) => item.title === active.id);
      const newIndex = outlines.findIndex((item) => item.title === over.id);
      const reorderedArray = arrayMove(outlines, oldIndex, newIndex);
      dispatch(setOutlines(reorderedArray));
    }
  }, [outlines, dispatch]);

  const handleAddSlide = useCallback(() => {
    if (!outlines) return;

    const newSlide: SlideOutline = {
      title: "Outline title",
      body: "Outline body",
    };

    const updatedOutlines = [...outlines, newSlide];
    dispatch(setOutlines(updatedOutlines));
  }, [outlines, dispatch]);

  return { handleDragEnd, handleAddSlide };
}; 