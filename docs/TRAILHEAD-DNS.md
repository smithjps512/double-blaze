\# Trailhead: DNS and Vercel Wildcard Setup



This replaces the earlier version of this document, which said to add a wildcard CNAME record. That does not work.



No em dashes anywhere.



\---



\## The correction



Vercel requires the \*\*nameservers method\*\* for wildcard domains. A wildcard CNAME will resolve, but the TLS certificate will never issue, and every customer site will throw a browser security warning.



The reason: wildcard certificates require the DNS-01 challenge, which means Vercel has to create a DNS record to prove domain ownership. It can only do that if it controls DNS. So the nameservers for doubleblaze.solutions must point to Vercel.



\---



\## The risk, and why order matters



Moving nameservers moves \*\*all\*\* DNS for the domain, not just the wildcard. Anything currently served by your registrar's DNS stops working the moment the new nameservers propagate, unless you have already recreated it in Vercel.



This is now a live risk, not a theoretical one, because \*\*yourteam@doubleblaze.solutions is a real Google mailbox\*\*. The records that make it work are in DNS today.



What breaks if you switch nameservers before recreating records, in order of pain:

1\. \*\*Email receiving.\*\* The MX records for the Google mailbox. Lose them and customer replies bounce.

2\. \*\*App email sending.\*\* SPF, DKIM, and DMARC. Lose them and every Trail Run check-in and Trailhead notification silently fails or lands in spam, during the launch of two programs that depend entirely on email.

3\. \*\*The apex and www records\*\* for the main site.

4\. Any domain-verification TXT records.



So: \*\*recreate every record in Vercel DNS before you switch the nameservers, not after.\*\* In that order, the cutover is invisible. Backwards, you take an outage on your own email at the worst possible moment.



\---



\## Step by step



\### Step 0: Baseline your email while it still works



Before touching anything, establish a known-good state.



1\. Send one email from the app through Resend as yourteam@doubleblaze.solutions. Confirm it arrives in a real inbox and is not in spam.

2\. Reply to it. Confirm the mailbox receives.



If something breaks later, this baseline tells you unambiguously that the DNS change caused it, rather than leaving you wondering whether it ever worked.



\### Step 1: Inventory your current DNS. Do not skip this.



At your current registrar or DNS provider, export or screenshot every record. Then verify independently from the command line, because dashboards hide things:



```

dig doubleblaze.solutions NS +short

dig doubleblaze.solutions MX +short

dig doubleblaze.solutions TXT +short

dig \_dmarc.doubleblaze.solutions TXT +short

dig doubleblaze.solutions CAA +short

dig www.doubleblaze.solutions +short

```



Also find the DKIM records. Resend and Google each publish DKIM on a selector subdomain (something like `resend.\_domainkey.doubleblaze.solutions` or `google.\_domainkey.doubleblaze.solutions`). Check the exact selectors in the Resend and Google Workspace dashboards, since these are the records people most often miss and they are what authorize your mail.



Write the complete list down. This is your rebuild checklist.



\### Step 2: The SPF merge. Read this carefully.



\*\*A domain must have exactly one SPF record.\*\* Two SPF TXT records is invalid and causes silent deliverability failure.



Because you now have both Google (for the mailbox) and Resend (for app sending), both want to be in SPF. They must be \*\*combined into a single record\*\*, not added separately. It should look like one TXT record containing both includes, something along these lines:



```

v=spf1 include:\_spf.google.com include:<resend's include value> \~all

```



Use the exact include value Resend gives you, not the placeholder above.



Run `dig doubleblaze.solutions TXT +short` and confirm what you actually have today. If you already have two separate SPF records, fix that now, before the migration, so you carry the correct merged version into Vercel rather than replicating a broken state.



\### Step 3: Add the domain and the wildcard in Vercel



1\. Vercel dashboard, open the Double Blaze project.

2\. Settings, then Domains.

3\. Add `doubleblaze.solutions` (the apex).

4\. Add `www.doubleblaze.solutions` if you use it.

5\. Add the wildcard: `\*.doubleblaze.solutions`.



When you save a wildcard domain, Vercel enables its nameservers for the domain and shows you the nameservers to use. Use exactly what the dashboard shows you.



\### Step 4: Recreate every record in Vercel DNS, before switching anything



In Vercel, open the team dashboard, Domains section, and select doubleblaze.solutions. Add every record from your Step 1 inventory:



\- MX records for the Google mailbox

\- The single merged SPF record from Step 2

\- DKIM records (both Google's and Resend's selectors)

\- DMARC (usually at `\_dmarc`)

\- Any verification TXT records

\- Any other subdomain records you rely on



Vercel handles the apex, www, and wildcard routing to your project automatically, so you do not need to hand-create those.



\*\*Do not proceed to Step 5 until this list is complete and checked line by line against Step 1.\*\*



\### Step 5: CAA records



Vercel uses Let's Encrypt. If any CAA records exist on the domain, you must include one permitting it:



```

0 issue "letsencrypt.org"

```



If no CAA records exist at all, you do not need to add one. Missing or wrong CAA is one of the most common reasons a wildcard certificate silently fails to issue.



\### Step 6: Switch the nameservers at your registrar



Go to your domain registrar and replace the current nameservers with the Vercel nameservers from Step 3.



This is the point of no return for propagation. Do it when you can watch it, not late on a Friday.



\### Step 7: Wait, then verify



DNS propagation commonly takes a few hours and can take up to 24 to 48 hours globally.



Verify in this order:



```

dig doubleblaze.solutions NS +short          # the Vercel nameservers

dig doubleblaze.solutions MX +short          # mail records must still be there

dig doubleblaze.solutions TXT +short         # one SPF record, DMARC present

dig anything.doubleblaze.solutions +short    # wildcard resolves to Vercel

```



Then in the Vercel dashboard, confirm `\*.doubleblaze.solutions` shows valid with a certificate issued. This is the step that fails if nameservers or CAA are wrong.



\### Step 8: Prove it end to end



1\. \*\*Repeat the Step 0 email test.\*\* Send from the app, confirm delivery and not spam. Reply, confirm receipt. This is the most important check in the list, because it is the one that protects two live programs.

2\. Publish one Trailhead site. Visit `that-name.doubleblaze.solutions`. It must load \*\*with a valid padlock\*\*. A certificate warning means the wildcard certificate did not issue, and you are back to Step 5 or 6.

3\. Visit an unclaimed subdomain like `zzz-not-a-real-site.doubleblaze.solutions`. It must 404 cleanly, not error, and not leak anything.

4\. Visit `doubleblaze.solutions` and `www.doubleblaze.solutions`. Both must still work.



\---



\## If you would rather not move nameservers



Alternative: skip the wildcard and add each customer subdomain to the Vercel project individually through the Vercel API at publish time. Vercel issues a certificate per subdomain and nameservers stay where they are.



Tradeoff: a per-publish API dependency, a Vercel API token in the app, add and remove handling on publish and takedown, and exposure to Vercel's domain-addition rate limits. Workable at 10 builds a month, but it puts a new failure mode directly in the publish path.



Recommendation: move the nameservers. With the inventory done first, it is a one-time, low-risk change.



\---



\## Checklist



\- \[ ] Email baseline captured: app send works, mailbox receives (Step 0)

\- \[ ] Full DNS inventory captured, including both DKIM selectors (Step 1)

\- \[ ] Exactly one SPF record, with both Google and Resend includes merged (Step 2)

\- \[ ] Apex, www, and `\*.doubleblaze.solutions` added in Vercel (Step 3)

\- \[ ] Every existing record recreated in Vercel DNS, especially MX, SPF, DKIM, DMARC (Step 4)

\- \[ ] CAA permits letsencrypt.org, if any CAA records exist (Step 5)

\- \[ ] Nameservers switched at the registrar (Step 6)

\- \[ ] Propagation verified with dig (Step 7)

\- \[ ] Wildcard certificate shows valid in Vercel (Step 7)

\- \[ ] Email test passes again after the move (Step 8)

\- \[ ] Published Trailhead site loads with a valid padlock (Step 8)

\- \[ ] Unknown subdomain 404s cleanly (Step 8)

\- \[ ] Main site and www still work (Step 8)

