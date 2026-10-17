Attribute VB_Name = "Form_GameStatsFormVersion3_Starters_Subs_Adjust"
Attribute VB_Base = "0{DDA6054F-A704-4DB9-AC84-0F827815D727}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Form_Close()
Call UpdateSubMinutes
Call UpdatePlayerGameMinutes
Call UpdateStarterMinutes
Call UpdateGameStatsForm

End Sub

Private Sub Form_Load()
     Me.GameStatsFormVersion3_Starters.Form.FormHeader.Visible = False
     DoCmd.MoveSize , , 8 * 1440, 8 * 1440

End Sub

Private Sub ExitAdjust_Click()
 
    Me.GameStatsFormVersion3_Starters.Form.FormHeader.Visible = True
    DoCmd.Close , ""
End Sub


