declare module 'epub-gen-memory' {
  interface EpubOptions {
    title: string
    author: string
    content: Array<{
      title: string
      data: string
    }>
  }

  class Epub {
    constructor(options: EpubOptions)
    promise: Promise<Buffer>
  }

  export default Epub
} 