"use client";
import React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { OutlineItem } from "./OutlineItem";
import { Button } from "@/components/ui/button";
import { SlideOutline } from "@/store/slices/presentationGeneration";
import { FileText } from "lucide-react";

interface OutlineContentProps {
    outlines: SlideOutline[] | null;
    isLoading: boolean;
    isStreaming: boolean;
    onDragEnd: (event: any) => void;
    onAddSlide: () => void;
}

const OutlineContent: React.FC<OutlineContentProps> = ({
    outlines,
    isLoading,
    isStreaming,
    onDragEnd,
    onAddSlide
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <div className="space-y-6 font-instrument_sans">
            {/* <div className="flex items-center justify-between">
                <h5 className="text-lg font-medium">
                    Presentation Outline
                </h5>
                {isStreaming && (
                    <div className="flex items-center text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Generating outlines...
                    </div>
                )}
            </div> */}
            {/* Skeleton loading state */}
            {isLoading && (
                <div className="space-y-4">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-white">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                        <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                                    </div>
                                </div>
                                <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Outlines content */}
            {outlines && outlines.length > 0 && (
                <div>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext
                            items={outlines?.map((item, index) => ({ id: item.title || `slide-${index}` })) || []}
                            strategy={verticalListSortingStrategy}
                        >
                            {outlines?.map((item, index) => (
                                <OutlineItem
                                    key={item.title || `slide-${index}`}
                                    index={index + 1}
                                    slideOutline={item}
                                    isStreaming={isStreaming}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <Button
                        variant="outline"
                        onClick={onAddSlide}
                        disabled={isLoading || isStreaming}
                        className="w-full my-4 text-blue-600 border-blue-200"
                    >
                        + Add Slide
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && outlines && outlines.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No outlines available</p>
                    <Button
                        variant="outline"
                        onClick={onAddSlide}
                        className="text-blue-600 border-blue-200"
                    >
                        + Add First Slide
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OutlineContent; 