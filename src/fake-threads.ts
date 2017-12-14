import { GmailMessage, GmailThread } from "./gmail-classes"

export const threads = [
  new GmailThread({
    messages: [{
      payload: {
        headers: [
          { name: "Subject", value: "[repo] thang" }
        ],
        parts: [{
          mimeType: "text/plain",
          body: {
            data: "TWVyZ2VkICMyNzAwLg0KDQotLQ0KWW91IGFyZSByZWNlaXZpbmcgdGhpcyBiZWNhdXNlIHlvdSBhcmUgc3Vic2NyaWJlZCB0byB0aGlzIHRocmVhZC4NClJlcGx5IHRvIHRoaXMgZW1haWwgZGlyZWN0bHkgb3IgdmlldyBpdCBvbiBHaXRIdWI6DQpodHRwczovL2dpdGh1Yi5jb20vbWluaXN0cnljZW50ZXJlZC9naXZpbmcvcHVsbC8yNzAwI2V2ZW50LTEzODY1NjI0NDk="
          }
        }]
      },
      threadId: 'thread1',
      id: 'message1',
    }],
    id: 'thread1',
  }),
  new GmailThread({
    messages: [
      {
      payload: {
        headers: [
          { name: "Subject", value: "RE: Trello something" }
        ],
        parts: [{
          mimeType: "text/plain",
          body: {
            data: "SGVyZSdzIHdoYXQgeW91IG1pc3NlZCBvbiBUcmVsbG8uDQoNCkplcmVteSBSaWNrZXR0cyBjb21tZW50ZWQgb24gdGhlIGNhcmQgQ2hhbmdlIHRvIGAudGVzdGAgZm9yIGRldiAoaHR0cHM6Ly90cmVsbG8uY29tL2MvU0RoVjNIMUkvMjc3Ni1jaGFuZ2UtdG8tdGVzdC1mb3ItZGV2KSBvbiBHaXZpbmcNCihodHRwczovL3RyZWxsby5jb20vYi85UTBaeUdROC9naXZpbmcpDQoNCiAiTm8gd2F5IGZvciBtZSB0byB0ZXN0IHRoaXMgb25lLiINCg0KIFJlcGx5IHZpYSBlbWFpbDogZGFuaWVsaGdtYSsyaWk2OXFta240ZHJlYThtd2RwKzJwZXc3Z2hrY2U0MXZsYXpyY3QrMm43c3lyc2gzYUBib2FyZHMudHJlbGxvLmNvbQ0KDQotLQ0KDQpDb250cm9sIGhvdyBvZnRlbiB5b3UgcmVjZWl2ZSBub3RpZmljYXRpb24gZW1haWxzIG9uIHlvdXIgYWNjb3VudCBwYWdlIChodHRwczovL3RyZWxsby5jb20vbXkvYWNjb3VudCkNCg0KRm9sbG93IEB0cmVsbG8gb24gVHdpdHRlciAoaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvZm9sbG93P3VzZXJfaWQ9MzYwODMxNTI4KQ0KDQpHZXQgVHJlbGxvIGZvciB5b3VyIGlQaG9uZSAoaHR0cDovL2l0dW5lcy5jb20vYXBwcy90cmVsbG8pIG9yIFRyZWxsbyBmb3IgeW91ciBBbmRyb2lkIChodHRwczovL3BsYXkuZ29vZ2xlLmNvbS9zdG9yZS9hcHBzL2RldGFpbHM/aWQ9Y29tLnRyZWzilIJsbykNCg=="
          }
        }]
      },
      threadId: 'thread2',
      id: 'message2',
    },
      {
      payload: {
        headers: [
          { name: "Subject", value: "RE: Trello something" }
        ],
        parts: [{
          mimeType: "text/plain",
          body: {
            data: "SGVyZSdzIHdoYXQgeW91IG1pc3NlZCBvbiBUcmVsbG8uDQoNCkplcmVteSBSaWNrZXR0cyBjb21tZW50ZWQgb24gdGhlIGNhcmQgQ2hhbmdlIHRvIGAudGVzdGAgZm9yIGRldiAoaHR0cHM6Ly90cmVsbG8uY29tL2MvU0RoVjNIMUkvMjc3Ni1jaGFuZ2UtdG8tdGVzdC1mb3ItZGV2KSBvbiBHaXZpbmcNCihodHRwczovL3RyZWxsby5jb20vYi85UTBaeUdROC9naXZpbmcpDQoNCiAiTm8gd2F5IGZvciBtZSB0byB0ZXN0IHRoaXMgb25lLiINCg0KIFJlcGx5IHZpYSBlbWFpbDogZGFuaWVsaGdtYSsyaWk2OXFta240ZHJlYThtd2RwKzJwZXc3Z2hrY2U0MXZsYXpyY3QrMm43c3lyc2gzYUBib2FyZHMudHJlbGxvLmNvbQ0KDQotLQ0KDQpDb250cm9sIGhvdyBvZnRlbiB5b3UgcmVjZWl2ZSBub3RpZmljYXRpb24gZW1haWxzIG9uIHlvdXIgYWNjb3VudCBwYWdlIChodHRwczovL3RyZWxsby5jb20vbXkvYWNjb3VudCkNCg0KRm9sbG93IEB0cmVsbG8gb24gVHdpdHRlciAoaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvZm9sbG93P3VzZXJfaWQ9MzYwODMxNTI4KQ0KDQpHZXQgVHJlbGxvIGZvciB5b3VyIGlQaG9uZSAoaHR0cDovL2l0dW5lcy5jb20vYXBwcy90cmVsbG8pIG9yIFRyZWxsbyBmb3IgeW91ciBBbmRyb2lkIChodHRwczovL3BsYXkuZ29vZ2xlLmNvbS9zdG9yZS9hcHBzL2RldGFpbHM/aWQ9Y29tLnRyZWzilIJsbykNCg=="
          }
        }]
      },
      threadId: 'thread2',
      id: 'message3',
    },
    ],
    id: 'thread2',
  })
]
