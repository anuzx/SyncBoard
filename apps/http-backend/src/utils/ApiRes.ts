export class ApiRes<T> {

  public statusCode: number
  public message: string
  public data: T
  public success: boolean
  constructor(statusCode: number, message: string, data: T
  ) {
    this.statusCode = statusCode,
      this.message = message,
      this.data = data,
      this.success = statusCode < 400 ? true : false
  }
}
