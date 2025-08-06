'use client'
import { useState, useEffect, useRef } from 'react'

import { LayoutInfo, LayoutGroup, GroupedLayoutsResponse, GroupSetting } from '../types'
import { toast } from 'sonner'

interface UseGroupLayoutLoaderReturn {
    layoutGroup: LayoutGroup | null
    loading: boolean
    error: string | null
    retry: () => void
}

// Global cache to store layout groups and avoid re-fetching
const layoutGroupCache = new Map<string, LayoutGroup>()
const loadingGroupsCache = new Set<string>()

export const useGroupLayoutLoader = (groupSlug: string): UseGroupLayoutLoaderReturn => {
    const [layoutGroup, setLayoutGroup] = useState<LayoutGroup | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const hasMountedRef = useRef(false)

    const loadGroupLayouts = async () => {
        // Check cache first
        if (layoutGroupCache.has(groupSlug)) {
            setLayoutGroup(layoutGroupCache.get(groupSlug)!)
            setLoading(false)
            setError(null)
            return
        }

        // Prevent multiple simultaneous requests for the same group
        if (loadingGroupsCache.has(groupSlug)) {
            return
        }

        try {
            setLoading(true)
            setError(null)
            loadingGroupsCache.add(groupSlug)

            const response = await fetch('/api/layouts')
            if (!response.ok) {
                toast.error('Error loading layouts', {
                    description: response.statusText,       
                })
                return
            }
            const groupedLayoutsData: GroupedLayoutsResponse[] = await response.json()
            
            // Find the specific group by slug
            const targetGroupData = groupedLayoutsData.find(
                group => group.groupName.toLowerCase() === groupSlug.toLowerCase()
            )

            if (!targetGroupData) {
                setError(`Group "${groupSlug}" not found`)
                return
            }

            const groupLayouts: LayoutInfo[] = []

            // Use settings from settings.json or provide defaults
            const groupSettings: GroupSetting = targetGroupData.settings ? targetGroupData.settings : {
                description: `${targetGroupData.groupName} presentation layouts`,
                ordered: false,
                default: false
            }
            for (const fileName of targetGroupData.files) {
                try {
                    const layoutName = fileName.replace('.tsx', '').replace('.ts', '')
                    const module = await import(`@/presentation-layouts/${targetGroupData.groupName}/${layoutName}`)

                    if (!module.default) {
                        toast.error(`${layoutName} has no default export`, {
                            description: 'Please ensure the layout file exports a default component',
                        })

                        console.warn(`${layoutName} has no default export`)
                        return;
                    }

                    if (!module.Schema) {
                        toast.error(`${layoutName} is missing required Schema export`, {
                            description: 'Please ensure the layout file exports a Schema',
                        })
                        console.error(`${layoutName} is missing required Schema export`)
                        return;
                    }

                    // Use empty object to let schema apply its default values
                    const sampleData = module.Schema.parse({})
                    const layoutId = module.layoutId || layoutName.toLowerCase().replace(/layout$/, '')

                    const layoutInfo: LayoutInfo = {
                        name: layoutName,
                        component: module.default,
                        schema: module.Schema,
                        sampleData,
                        fileName,
                        groupName: targetGroupData.groupName,
                        layoutId
                    }

                    groupLayouts.push(layoutInfo)

                } catch (importError) {
                    console.error(`Failed to import ${fileName} from ${targetGroupData.groupName}:`, importError)

                    // Try alternative import path
                    try {
                        const layoutName = fileName.replace('.tsx', '').replace('.ts', '')
                        const module = await import(`@/presentation-layouts/${targetGroupData.groupName}/${layoutName}`)

                        if (module.default && module.Schema) {
                            const sampleData = module.Schema.parse({})
                            // if layoutId is not provided, use the layoutName
                            const layoutId = module.layoutId || layoutName.toLowerCase().replace(/layout$/, '')
                            const layoutInfo: LayoutInfo = {
                                name: layoutName,
                                component: module.default,
                                schema: module.Schema,
                                sampleData,
                                fileName,
                                groupName: targetGroupData.groupName,
                                layoutId
                            }
                            groupLayouts.push(layoutInfo)
                        } else {
                            console.error(`${layoutName} is missing required exports (default component or Schema)`)
                        }
                    } catch (altError) {
                        console.error(`Alternative import also failed for ${fileName} from ${targetGroupData.groupName}:`, altError)
                    }
                }
            }

            if (groupLayouts.length === 0) {
                toast.error('No valid layouts found', {
                    description: `No valid layouts found in "${groupSlug}" group.`,
                })
                setError(`No valid layouts found in "${groupSlug}" group.`)
            } else {
                const group: LayoutGroup = {
                    groupName: targetGroupData.groupName,
                    layouts: groupLayouts,
                    settings: groupSettings
                }
                
                // Cache the result
                layoutGroupCache.set(groupSlug, group)
                setLayoutGroup(group)
                setError(null)
            }

        } catch (error) {
            console.error('Error loading group layouts:', error)
            setError(error instanceof Error ? error.message : 'Failed to load group layouts')
        } finally {
            setLoading(false)
            loadingGroupsCache.delete(groupSlug)
        }
    }

    const retry = () => {
        hasMountedRef.current = false
        loadGroupLayouts()
    }

    useEffect(() => {
        if (groupSlug && !hasMountedRef.current) {
            hasMountedRef.current = true
            loadGroupLayouts()
        }
    }, [groupSlug])

    return {
        layoutGroup,
        loading,
        error,
        retry,
    }
} 