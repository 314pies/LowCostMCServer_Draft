# Low-Cost-MC-Server (Draft)

## Dealing with the Cold Start
1. Response with [
DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type) code first, then later edit using [Edit Original Interaction Response](https://discord.com/developers/docs/interactions/receiving-and-responding#edit-original-interaction-response)
(Request some testing/research to confirm whether this work with Aws Lambda, may complicate the project?)
2. (**Adopted**) Identifying cold start then send back a response 
3. Use Lambda provisioned-concurrency (Required additional 1.5$/month cost according to [AWS price calculator](https://calculator.aws/#/createCalculator/Lambda), using 750 hr for the ```Time for which Provisioned Concurrency is enabled``` field)

****
