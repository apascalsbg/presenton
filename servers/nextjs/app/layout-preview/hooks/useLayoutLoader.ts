'use client'
import { useState, useEffect } from 'react'

import { LayoutInfo, LayoutGroup, GroupedLayoutsResponse, GroupSetting } from '../types'
import { toast } from 'sonner'

interface UseLayoutLoaderReturn {
    layoutGroups: LayoutGroup[]
    layouts: LayoutInfo[]
    loading: boolean
    error: string | null
    retry: () => void
}

export const useLayoutLoader = (): UseLayoutLoaderReturn => {
    const [layoutGroups, setLayoutGroups] = useState<LayoutGroup[]>([])
    const [layouts, setLayouts] = useState<LayoutInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadAllLayouts = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/layouts')
            if (!response.ok) {
                toast.error('Error loading layouts', {
                    description: response.statusText,       
                })
                return
            }
            const groupedLayoutsData: GroupedLayoutsResponse[] = await response.json()
            const loadedGroups: LayoutGroup[] = []
            const allLayouts: LayoutInfo[] = []

            for (const groupData of groupedLayoutsData) {
                const groupLayouts: LayoutInfo[] = []

                const groupSettings: GroupSetting = groupData.settings ? groupData.settings : {
                    description: `${groupData.groupName} presentation layouts`,
                    ordered: false,
                    default: false
                }

                for (const fileName of groupData.files) {
                    try {
                        const layoutName = fileName.replace('.tsx', '').replace('.ts', '')
                        const module = await import(`@/presentation-layouts/${groupData.groupName}/${layoutName}`)

                        if (!module.default) {
                            toast.error(`${layoutName} has no default export`, {
                                description: 'Please ensure the layout file exports a default component',
                            })
                            console.warn(`${layoutName} has no default export`)
                            throw new Error(`${layoutName} has no default export`)
                        }

                        if (!module.Schema) {
                            toast.error(`${layoutName} is missing required Schema export`, {
                                description: 'Please ensure the layout file exports a Schema',
                            })
                            console.error(`${layoutName} is missing required Schema export`)
                            throw new Error(`${layoutName} is missing required Schema export`)
                        }

                        // Use empty object to let schema apply its default values
                        // User will need to provide actual data when using the layouts
                        const sampleData = module.Schema.parse({})
                        const layoutId = module.layoutId || layoutName.toLowerCase().replace(/layout$/, '')

                        const layoutInfo: LayoutInfo = {
                            name: layoutName,
                            component: module.default,
                            schema: module.Schema,
                            sampleData,
                            fileName,
                            groupName: groupData.groupName,
                            layoutId
                        }

                        groupLayouts.push(layoutInfo)
                        allLayouts.push(layoutInfo)

                    } catch (importError) {
                        console.error(`Failed to import ${fileName} from ${groupData.groupName}:`, importError)

                        // Try alternative import path
                        try {
                            const layoutName = fileName.replace('.tsx', '').replace('.ts', '')
                            const module = await import(`@/presentation-layouts/${groupData.groupName}/${layoutName}`)

                            if (module.default && module.Schema) {
                                // Use empty object to let schema apply its default values
                                const sampleData = module.Schema.parse({})
                                // if layoutId is not provided, use the layoutName
                                const layoutId = module.layoutId || layoutName.toLowerCase().replace(/layout$/, '')

                                const layoutInfo: LayoutInfo = {
                                    name: layoutName,
                                    component: module.default,
                                    schema: module.Schema,
                                    sampleData,
                                    fileName,
                                    groupName: groupData.groupName,
                                    layoutId
                                }
                                groupLayouts.push(layoutInfo)
                                allLayouts.push(layoutInfo)
                            } else {
                                console.error(`${layoutName} is missing required exports (default component or Schema)`)
                            }
                        } catch (altError) {
                            console.error(`Alternative import also failed for ${fileName} from ${groupData.groupName}:`, altError)
                        }
                    }
                }

                if (groupLayouts.length > 0) {
                    loadedGroups.push({
                        groupName: groupData.groupName,
                        layouts: groupLayouts,
                        settings: groupSettings
                    })
                }
            }

            if (allLayouts.length === 0) {
                toast.error('No valid layouts found', {
                    description: 'Make sure your layout files export both a default component and a Schema.',
                })
                setError('No valid layouts found. Make sure your layout files export both a default component and a Schema.')
            } else {
                setLayoutGroups(loadedGroups)
                setLayouts(allLayouts)
                setError(null)
            }

        } catch (error) {
            console.error('Error loading layouts:', error)
            setError(error instanceof Error ? error.message : 'Failed to load layouts')
        } finally {
            setLoading(false)
        }
    }

    const retry = () => {
        loadAllLayouts()
    }

    useEffect(() => {
        loadAllLayouts()
    }, [])

    return {
        layoutGroups,
        layouts,
        loading,
        error,
        retry
    }
} 