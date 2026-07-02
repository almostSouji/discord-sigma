σφ (Discord ID `1178432874429567006`) processes events containing data Discord considers sensitive to evaluate it against a set of defined detection rules.
Since this is a safety feature explicitly set up by server staff, this functionality is automatically agreed to by the server staff deciding to use the app and cannot be opted out of by individual users.

```
GUILD_MEMBERS (1 << 1)
  - GUILD_MEMBER_ADD
  - GUILD_MEMBER_UPDATE
  - GUILD_MEMBER_REMOVE
GUILD_PRESENCES (1 << 8)
  - PRESENCE_UPDATE
DIRECT_MESSAGES (1 << 12)
  - MESSAGE_CREATE
  - MESSAGE_UPDATE
  - MESSAGE_DELETE
MESSAGE_CONTENT (1 << 15)
```

Data may be retained within Discord as far as alerts inform server staff about events that match predefined patterns.
This is the explicit purpose of this application.

The developer does not retain information about these alerts and cannot retrieve or delete any alerts on request once posted.
Please contact server staff for any concerns regarding your data being retained in alert channels.

The developer may shortly view and retain event data for debugging purposes without prior notice.
This data will be deleted after the associated debugging procedure has been completed and will not be retained further for any purpose or any time.

Other than this, data is not retained outside of Discord.
The app does not keep databases of any kind that include user data.

If data is submitted to the app in form of commands or modal submissions, it may be used to publish rules to this or other rule repositories or review venues in the future.
In case of publishing, this will be clearly stated or obvious from the submission procedure.

