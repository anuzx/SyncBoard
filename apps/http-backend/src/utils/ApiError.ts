export class ApiError extends Error {
  public statusCode: number
  public errors?: string[]
  public stack?: string | undefined
  constructor(statusCode: number, message: string, errors: string[] = [], stack: string | undefined) {
    super(message)
    this.statusCode = statusCode,
      this.errors = errors,
      this.stack = stack
  }
}
