/**
 * Sample Data Generator Utility
 * 
 * Generates realistic sample data from Zod schemas for layout previews.
 * Provides context-aware data generation based on field names and types.
 */

export const generateSampleDataFromSchema = (schema: any, layoutName: string): any => {
    if (!schema) return {}

    try {
        // Generate realistic sample data for all fields first
        const generatedData = generateRealisticData(schema._def?.shape || schema.shape, layoutName)
        

        // Merge generated data with defaults, giving priority to defaults
        return generatedData
    } catch (error) {
        console.error(`Error generating sample data for ${layoutName}:`, error)
        return {}
    }
}



const generateRealisticData = (shape: any, layoutName: string): any => {
    if (!shape) return {}

    const data: any = {}

    for (const [key, fieldSchema] of Object.entries(shape as any)) {
        const field = fieldSchema as any
        
        // Generate data for all fields (both required and optional)
        // We'll let the defaults override this later if they exist
        data[key] = generateFieldValue(key, field, layoutName)
    }

    return data
}

// const arrayMock = (length:number,element:any) => {
//     return Array.from({length},()=>generateFieldValue(fieldName, element, layoutName))
// }
// const mockObject = (shapes:any) => {
//     let obj:any = {}
//    for(const [key,shape] of Object.entries(shapes)){
//     const defaultValue = shape.def.defaultValue
//     obj[key] = defaultValue ? defaultValue : generateFieldValue(key, shape, layoutName)
//    }
//    return obj
// }


// const generateMockValue = (fileType:string,format?:string)=>{
//     switch(fileType){
//         case 'number':
//             return Math.floor(Math.random() * 100) + 1
//         case 'string':
//             return generateStringValue(fieldName, fieldSchema, layoutName)
//         case 'boolean':
//             return Math.random() > 0.5
//         case 'object':
//             return mockObject(fieldSchema.def.shape)
//         case 'array':
//             return arrayMock(fieldSchema.def.length,fieldSchema.def.element)
//     }

// }



const generateFieldValue = (fieldName: string, fieldSchema: any, layoutName: string): any => {
    console.log('BADU',fieldSchema,fieldName,layoutName)
    const defaultValue = fieldSchema.def.defaultValue;

    if(defaultValue){
        console.log('DEFAULT VALUE',defaultValue)
        return defaultValue;
    }

    if(fieldSchema.def.type ==='optional'){
        return generateFieldValue(fieldName, fieldSchema.def.innerType, layoutName)
    }

    // Get the actual field type - handle optional fields properly
    let actualFieldSchema = fieldSchema
    let fieldType = fieldSchema._def?.typeName
    
    // If this is an optional field (ZodOptional), get the inner type
    if (fieldType === 'ZodOptional') {
        actualFieldSchema = fieldSchema._def?.innerType
        fieldType = actualFieldSchema?._def?.typeName
    }

    // For preview purposes, always generate data for optional fields
    // (users want to see how the layout looks with content)

    // Handle different field types
    switch (fieldType) {
        case 'ZodString':
            return generateStringValue(fieldName, actualFieldSchema, layoutName)
        case 'ZodArray':
            return generateArrayValue(fieldName, actualFieldSchema, layoutName)
        case 'ZodObject':
            return generateObjectValue(fieldName, actualFieldSchema, layoutName)
        case 'ZodEnum':
            const options = actualFieldSchema._def?.values || []
            return options[Math.floor(Math.random() * options.length)]
        case 'ZodBoolean':
            return Math.random() > 0.5
        case 'ZodNumber':
            return Math.floor(Math.random() * 100) + 1
        default:
            return generateStringValue(fieldName, actualFieldSchema, layoutName)
    }
}



const generateStringValue = (fieldName: string, fieldSchema: any, layoutName: string): string => {
    const lowerField = fieldName.toLowerCase()

    // Handle URLs (images, logos, backgrounds, etc.)
    if (lowerField.includes('url') || lowerField.includes('image') || lowerField.includes('logo')) {
        if (lowerField.includes('logo')) {
            return 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=200&fit=crop'
        }
        if (lowerField.includes('background')) {
            const backgrounds = [
                'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop',
                'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop',
                'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop'
            ]
            return backgrounds[Math.floor(Math.random() * backgrounds.length)]
        }
        // Regular images
        const images = [
            'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop'
        ]
        return images[Math.floor(Math.random() * images.length)]
    }

    // Handle email
    if (lowerField.includes('email')) {
        const domains = ['example.com', 'company.com', 'business.org']
        const names = ['contact', 'info', 'hello', 'support']
        return `${names[Math.floor(Math.random() * names.length)]}@${domains[Math.floor(Math.random() * domains.length)]}`
    }

    // Handle phone
    if (lowerField.includes('phone')) {
        return `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
    }

    // Handle website
    if (lowerField.includes('website')) {
        const sites = ['https://example.com', 'https://company.com', 'https://business.org']
        return sites[Math.floor(Math.random() * sites.length)]
    }

    // Handle LinkedIn
    if (lowerField.includes('linkedin')) {
        return 'https://linkedin.com/company/example'
    }

    // Handle specific field names
    if (lowerField.includes('title')) {
        const titles = [
            'Welcome to Our Presentation',
            'Key Business Insights',
            'Product Overview',
            'Market Analysis',
            'Future Vision',
            'Strategic Goals'
        ]
        return titles[Math.floor(Math.random() * titles.length)]
    }

    if (lowerField.includes('subtitle')) {
        const subtitles = [
            'Driving innovation through technology',
            'Transforming the way we work',
            'Building solutions for tomorrow',
            'Excellence in every detail',
            'Your success is our mission'
        ]
        return subtitles[Math.floor(Math.random() * subtitles.length)]
    }

    if (lowerField.includes('author') || lowerField.includes('name')) {
        const names = ['Alex Johnson', 'Sarah Chen', 'Michael Rodriguez', 'Emily Davis', 'David Kim']
        return names[Math.floor(Math.random() * names.length)]
    }

    if (lowerField.includes('organization') || lowerField.includes('company')) {
        const orgs = ['Tech Innovations Inc.', 'Future Solutions Ltd.', 'Global Dynamics Corp.', 'NextGen Enterprises']
        return orgs[Math.floor(Math.random() * orgs.length)]
    }

    if (lowerField.includes('date')) {
        return new Date().toLocaleDateString()
    }

    if (lowerField.includes('content')) {
        const contents = [
            'Our innovative approach combines cutting-edge technology with proven methodologies to deliver exceptional results. We focus on scalability, reliability, and user experience.',
            'Through strategic partnerships and continuous innovation, we\'ve established ourselves as leaders in the industry. Our solutions are designed to meet evolving market demands.',
            'With over a decade of experience, our team brings deep expertise and fresh perspectives to every project. We\'re committed to exceeding expectations and driving growth.'
        ]
        return contents[Math.floor(Math.random() * contents.length)]
    }

    if (lowerField.includes('caption')) {
        const captions = [
            'Innovative solutions driving business transformation',
            'Real-time analytics and insights at your fingertips',
            'Seamless integration with existing workflows',
            'Empowering teams to achieve more'
        ]
        return captions[Math.floor(Math.random() * captions.length)]
    }

    if (lowerField.includes('action') || lowerField.includes('cta')) {
        const actions = [
            'Get Started Today!',
            'Schedule a Demo',
            'Contact Our Team',
            'Learn More',
            'Try It Free'
        ]
        return actions[Math.floor(Math.random() * actions.length)]
    }

    // Default text based on field length constraints
    const minLength = fieldSchema._def?.checks?.find((c: any) => c.kind === 'min')?.value || 10
    const maxLength = fieldSchema._def?.checks?.find((c: any) => c.kind === 'max')?.value || 100

    if (maxLength <= 50) {
        return 'Sample short text content'
    } else if (maxLength <= 150) {
        return 'This is sample medium-length text content for preview purposes'
    } else {
        return 'This is sample long-form text content that demonstrates how the layout will look with realistic data. It provides a good representation of the final presentation slide.'
    }
}

const generateArrayValue = (fieldName: string, fieldSchema: any, layoutName: string): any[] => {
    const itemSchema = fieldSchema._def?.type
    const minItems = fieldSchema._def?.minLength?.value || 2
    const maxItems = Math.min(fieldSchema._def?.maxLength?.value || 5, 6)
    const itemCount = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems

    const lowerField = fieldName.toLowerCase()

    if (lowerField.includes('bullet') || lowerField.includes('point')) {
        const bulletPoints = [
            'Increased efficiency and productivity',
            'Cost-effective solutions',
            'Enhanced user experience',
            'Scalable architecture',
            'Real-time analytics',
            '24/7 customer support',
            'Seamless integration capabilities',
            'Advanced security features'
        ]
        return bulletPoints.slice(0, itemCount)
    }

    if (lowerField.includes('takeaway') || lowerField.includes('key')) {
        const takeaways = [
            'Strategic advantage through innovation',
            'Proven ROI within 6 months',
            'Comprehensive support included',
            'Future-ready technology stack',
            'Industry-leading performance'
        ]
        return takeaways.slice(0, itemCount)
    }

    // Generate generic array items
    const items = []
    for (let i = 0; i < itemCount; i++) {
        if (itemSchema) {
            items.push(generateFieldValue(`${fieldName}Item`, itemSchema, layoutName))
        } else {
            items.push(`Sample item ${i + 1}`)
        }
    }
    return items
}

const generateObjectValue = (fieldName: string, fieldSchema: any, layoutName: string): any => {
    const shape = fieldSchema._def?.shape
    if (!shape) return {}

    const obj: any = {}
    for (const [key, subSchema] of Object.entries(shape)) {
        obj[key] = generateFieldValue(key, subSchema, layoutName)
    }
    return obj
} 