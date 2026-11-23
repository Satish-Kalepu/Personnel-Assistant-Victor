# Voice deployment review - 2026-11-20

**State:** Source, local packaging, and one synthetic Sarvam STT/TTS round trip are verified. No gateway, registry, secret, role, load balancer, or live application update has been provisioned in AWS. A concrete CloudFormation execution approval is still required before an eventual deployment.

## Why a gateway is required

The Sarvam key stays on a trusted server. Android and web send authenticated microphone frames to that server; it maintains streaming Sarvam connections and forwards final transcripts through the existing Mumbai Victor API. This requires a persistent WSS-capable host. The current API Gateway HTTP API / short Lambda request is not that host. The gateway container is built locally as `victor-voice:review` and has passed local health/invalid-token checks; it has not been pushed to a registry.

## Managed hosting candidate and base cost

One candidate is ECS Express Mode in Mumbai, with 0.25 x86 vCPU, 512 MiB RAM, one task, a two-AZ public Application Load Balancer and managed HTTPS URL. Keep one replica initially because owner connection tracking is per process. Configure only ALB ingress to the task, no raw public task ingress, and normal outbound provider access.

AWS Price List API reads for `ap-south-1` on 2026-11-20 returned:

| Component | Catalog rate in USD | Assumed monthly amount (730 hours) |
| --- | --- | ---: |
| Fargate x86 CPU | 0.04256 / vCPU-hour | 7.77 for 0.25 vCPU |
| Fargate memory | 0.004655 / GB-hour | 1.70 for 0.5 GB |
| Application Load Balancer | 0.0239 / hour | 17.45 |
| Public IPv4 | 0.005 / address-hour | 10.95 for three addresses |
| **Base estimate** | | **37.86/month** |

This excludes ALB capacity-unit usage (0.008 / LCU-hour), logs, registry/image storage, secret storage, data transfer, taxes, and speech/model/API charges. It assumes two ALB IPv4 addresses plus one public task address, public-subnet outbound access, and no NAT Gateway. More addresses, AZs, replicas, or a NAT Gateway increase the bill. These are estimates, not a fixed quote. API catalog usage labels: APS3-Fargate-vCPU-Hours:perCPU, APS3-Fargate-GB-Hours, APS3-LoadBalancerUsage (LoadBalancing:Application), APS3-PublicIPv4:InUseAddress.

[ECS Express Mode documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html) lists the underlying billed resources. The [CLI quickstart](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-getting-started.html) describes the managed HTTPS URL and public load balancer. The figures above were read directly from the authenticated public-price API; no application/customer content was involved.

This base cost is material relative to the existing $50 account budget alert. Sarvam speech fees are billed separately. A previously approved existing Mumbai host may be cheaper, but its ownership, capacity, TLS/domain setup, and other workloads must be reviewed before reuse. A read-only inventory found one running Linux t3.medium in Mumbai and three hosted DNS zones. No server login, workload/capacity inspection, DNS record read/change, installation, or host selection has occurred. The owner was asked whether the existing instance may be considered for reuse.

## Preconditions and staged rollout

1. Owner has placed the Sarvam key in the private root `.env`; Git ignores `.env` and `.ENV`. It was used only for a fixed synthetic phrase. Do not copy it into public settings, client code, images, or records.
2. Confirm Sarvam Model APIs retention is No retention (0 days) for the key's workspace. Marketing default-retention statements do not replace the actual workspace/product setting. Production gateway startup remains gated on this confirmation.
3. Choose the host/cost envelope and public WSS endpoint. Prepare an immutable private image, server secret reference, scoped execution permissions and the complete resource/CloudFormation review. CloudFormation must not execute before the owner approves the concrete change set.
4. Deploy the gateway and update the backend's `VoiceGatewayUrl` after review. It defaults empty; no Sarvam key is stored in the Lambda or app. Gateway public configuration uses the existing Cognito pool/client and Mumbai API. Runtime business requests use the owner's verified Cognito access token; the gateway needs no table/model administration permission.
5. Verify a full signed-in browser exchange, interruptions, mute/stop, mode boundary, secret hold, allowance hold and disconnect cleanup. Then the friend rebuilds the Android app from the repo and the owner validates on Pixel 8a Android 16+. No new client property or ZIP is required.

## Evidence and limitations

Twenty backend tests, eleven gateway tests, web voice/memory checks, SAM source/build lint and packaging, and Docker build/startup/auth-rejection checks pass. A synthetic Sarvam sample produced first PCM in 692ms including connection setup, generated 4.02 seconds of speech, and transcribed correctly. This one result is not a full-conversation latency, human-accent/noise accuracy, native playback or listening-quality benchmark. See [research](voice-research-2026-11-19.md) for the acceptance targets and current model-response buffering limitation.


## API Gateway and setup clarification (2026-11-20)

Owner confirmed Model APIs retention is No retention (0 days); this is owner-reported, not an independent account-UI audit. That confirmation is no longer a missing input. Owner questioned the need for EC2; no existing-server reuse was approved. API Gateway WebSocket plus an on-demand Lambda worker is a credible alternative to investigate, with session buffering/ordering, authentication, packet encoding and latency work. The prior hosting estimate describes one candidate, not a mandatory architecture. See [API Gateway alternative](voice-api-gateway-option.md). No application refactor or infrastructure change performed for this discussion.
