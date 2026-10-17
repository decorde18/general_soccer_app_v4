Attribute VB_Name = "Form_SeasonInfoMainForm"
Attribute VB_Base = "0{458D74C4-22CA-4BAB-9CA4-BEEE2A8497B5}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False

Option Compare Database


Private Sub Command10_Click()
On Error GoTo Err_Command10_Click


    DoCmd.Close

Exit_Command10_Click:
    Exit Sub

Err_Command10_Click:
    MsgBox Err.Description
    Resume Exit_Command10_Click
    
End Sub
Private Sub Command11_Click()
On Error GoTo Err_Command11_Click

    Dim stDocName As String

    stDocName = "SeasonRoster"
    DoCmd.OpenReport stDocName, acNormal, "FilterYear"


Exit_Command11_Click:
    Exit Sub

Err_Command11_Click:
    MsgBox Err.Description
    Resume Exit_Command11_Click
    
End Sub
Private Sub Command12_Click()
On Error GoTo Err_Command12_Click


    DoCmd.GoToRecord , , acNewRec

Exit_Command12_Click:
    Exit Sub

Err_Command12_Click:
    MsgBox Err.Description
    Resume Exit_Command12_Click
    
End Sub
Private Sub Command13_Click()
On Error GoTo Err_Command13_Click


    DoCmd.GoToRecord , , acNext

Exit_Command13_Click:
    Exit Sub

Err_Command13_Click:
    MsgBox Err.Description
    Resume Exit_Command13_Click
    
End Sub
Private Sub Command14_Click()
On Error GoTo Err_Command14_Click


    DoCmd.GoToRecord , , acPrevious

Exit_Command14_Click:
    Exit Sub

Err_Command14_Click:
    MsgBox Err.Description
    Resume Exit_Command14_Click
    
End Sub
Private Sub Command15_Click()
On Error GoTo Err_Command15_Click


    DoCmd.GoToRecord , , acFirst

Exit_Command15_Click:
    Exit Sub

Err_Command15_Click:
    MsgBox Err.Description
    Resume Exit_Command15_Click
    
End Sub
Private Sub Command16_Click()
On Error GoTo Err_Command16_Click


    DoCmd.GoToRecord , , acFirst

Exit_Command16_Click:
    Exit Sub

Err_Command16_Click:
    MsgBox Err.Description
    Resume Exit_Command16_Click
    
End Sub
Private Sub Command17_Click()
On Error GoTo Err_Command17_Click


    DoCmd.Close

Exit_Command17_Click:
    Exit Sub

Err_Command17_Click:
    MsgBox Err.Description
    Resume Exit_Command17_Click
    
End Sub


Private Sub Form_Load()
Let He = DLookup("SchoolPrimaryColor", "DatabaseDefaults")
Let Re = Val("&H" & Left(Right(He, 6), 2))
Let Gr = Val("&H" & Left(Right(He, 4), 2))
Let Bl = Val("&H" & Right(He, 2))
Let He2 = DLookup("SchoolSecondaryColor", "DatabaseDefaults")
Let Re2 = Val("&H" & Left(Right(He2, 6), 2))
Let Gr2 = Val("&H" & Left(Right(He2, 4), 2))
Let Bl2 = Val("&H" & Right(He2, 2))
Me.Section(acDetail).BackColor = RGB(Re2, Gr2, Bl2)
Me.Label1.ForeColor = RGB(Re, Gr, Bl)
Me.Label2.ForeColor = RGB(Re, Gr, Bl)
Me.Label3.ForeColor = RGB(Re, Gr, Bl)
Me.Label4.ForeColor = RGB(Re, Gr, Bl)
Me.Label5.ForeColor = RGB(Re, Gr, Bl)
Me.Label6.ForeColor = RGB(Re, Gr, Bl)
Me.Label7.ForeColor = RGB(Re, Gr, Bl)

End Sub
