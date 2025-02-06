import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return Response.json(data)
  } catch (error) {
    console.error('Error fetching pages:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : '获取页面失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, folder } = await request.json()
    
    if (!id || !folder) {
      return Response.json(
        { error: 'ID和文件夹名称不能为空' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('pages')
      .update({ folder })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating page:', error)
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json(data)
  } catch (error) {
    console.error('Error in PUT handler:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : '更新页面失败' },
      { status: 500 }
    )
  }
} 