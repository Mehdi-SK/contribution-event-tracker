import { IExternalClient } from '../IExternalClient.js'
export class ApicuronClient implements IExternalClient {
  // private token: string = '<API_TOKEN>'
  // private apiUrl: string = '<API_URL>'
  sendPayload(): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
