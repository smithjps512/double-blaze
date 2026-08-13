# Electric Grid Member Website: Project Brief

Client brief as authored by James, following an hour-long interview with the
club. This is the source of record for what the client asked for. Scope
decisions, sequencing, and anything Double Blaze decided rather than the client
live in `electric-grid-build-plan.md`, so this document stays the client's
words rather than ours.

No em dashes anywhere in this document or any copy it generates.

---

**Purpose:** The purpose of the organization is provide a forum for individuals
working in and around the electric grid/power industry to discuss and learn
about the impacts that AI is having, or could have, on the electric grid.

## Who are the users

**People employed in the industry:** There are a wide range of possibilities for
this user group including executives, analysts, technology, non-technology. They
have two common threads in common, the work directly for a "power company" that
manages the electric grid in their state, AND they have an interest in learning
or discussing AI's impact on their specific industry.

*Note: the organization is an international organization with no restriction to
join geographically. This would also mean a multi-lingual, multi-law/regulation
group.*

**People employed in the AI industry:** These are people who have technical or
product expertise primarily. This would include individuals working on AI
models, individuals building tools and applications utilizing AI models,
organizations that service AI companies (primarily data centers and hardware
manufacturers like Nvidia).

**Guest who are providing insight:** On regularly scheduled meetings, or through
written articles, guest should be able to have some level of access to the site.
This more limited access may be a time frame, or simply to post and react to a
an article/report they have written specifically for the membership to consume.

**Administrator(s):** The site administrator(s) will be able to manage members
access, manage guest access, manage events, and manage content.

## Use of the site (features/functions)

| feature/function | Description | benefit |
| :---- | :---- | :---- |
| Join | Members should be able to request to join, or be invited to join by admin. The join process should be simple and common/known to the one joining (e.g. join using google, email, etc.). If invited, the member can join without any further approval, if the member signs up on their own to join, admin is notified and must approve member. Enough information should be gathered from member requesting to join (employer, affiliation to industry/AI, etc) to make an approval decision | Simplicity. Properly restricted without difficult barriers |
| Profile | Once a member, the first prompt is to create a profile. The profile should include a photo of the member (optional), where they are employed, a career description (linkedin light like), and any info they would like to share | The goal is for members to engage with the group and one another, the profile is the very beginning of the process |
| Connect with members | Not required, but encouraged. Members are encouraged to interact through a variety of opportunities including forums, reacting to post by other members/guest, regular meetings, etc. connecting with members allows generating events and interactions more easily by selecting members one is already connected to | Serves sites core purpose |
| Schedule events | Anyone member or admin can schedule an event and invite others. Most users have one of the following already in use: google meet, teams, or zoom and should be able to include a link in the invite. For in person events, adding location would be great. Topic and description of event along with date should be required for any scheduling event | Serves sites core purpose |
| Posting media | An article is a formal document or media prepared and shared with the group. Articles live in their own space. An article can be written OR audible/video (podcast). Articles live as an extension of the user profile and profile is the "author" or creator of the article or article series. | Serves sites core purpose |
| Access media | Users can access articles through the content area of the site (need a name) articles include multi-media including written, audio, video. Members must be logged in to access articles. Simple analytics are tracked on how many times an article has been accessed. Total access count + unique user access count is captured | Serves sites core purpose |
| Site landing/marketing page | The landing page prior to a member logging in or joining promotes the sites purpose and describes all of the features a member gets through joining. This should be visual and engaging demonstrating what access provides with limited text, brief and to the point while modern and visually appealing it should feel like a multi-media site with a targeted focus of serving the core purpose of the community and enticing members to join | Grow membership |
| Group and site policy | Serving the purpose means limiting access to known members, or knowable members, while providing a respectful and collaborative environment for everyone. The goal is for the members to contribute, not be passive. The site messaging, policies and feature should all reflect this | Serve sites core purpose |
| Notifications and communications | When members post articles or media, or want to invite other members to an event; notifications should be distributed to other members. Members can turn off notifications in their profile if they choose. | Serves site core purpose awareness |
| non-solicitation | This is a policy, but worth calling out. This is not an advertising site where money is made by the organization, it's serves a single purpose of learning and sharing of information to the specific topic of AI in the power/electric grid industry | Serves site core purpose |
| giving | There may be opportunities for members to support financially a cause, or even the site/organization cost itself. Creating campaigns is restricted to the administrator(s) and setting it up requires contacting double-blaze to create | Careful planning and execution |

## What's Critical to Quality

The number one quality measure is member ability to be active and contribute to
the site and other members through engagement and sharing of media. The site
must have ways to encourage this before, during, and after signing up.

Restricting members by administrator. Administrator(s) should have final
approval on another member joining. While membership is key, it is focused on
specific industries and topical experts.

Media creation and distribution is HIGHLY encouraged and critical to the site
having value. Members should be able to easily submit and distribute media,
create channels, etc. this is critical to the site success.

## Build approach

We (Claude Code and James) will organize site creation into sessions and gates,
a session may have multiple stages/phases. Claude Code will build, test, and
generate PRs for deployment, generate all necessary infrastructure setup, all
migrations, and provide complete documentation in the repo.

James will test each session only when it reaches a gate that requires manual
test, otherwise, Claude Code will continue it's build until a manual test is
required.
