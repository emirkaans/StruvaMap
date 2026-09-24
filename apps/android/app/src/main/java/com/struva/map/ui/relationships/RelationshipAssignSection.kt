package com.struva.map.ui.relationships

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.StruvaColors

// Seçim diyaloğunda "yeni ilişki" satırının anahtarı.
private const val NEW_OPTION = "__new__"

// Sonuç ekranında: "Bu sonuç hangi ilişkin için?" — bağlanan sonuçlar
// Harita sekmesinde o ilişkinin düğümü olarak görünür.
@Composable
fun RelationshipAssignSection(
    resultId: String,
    testId: String,
    viewModel: RelationshipAssignViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    LaunchedEffect(resultId) { viewModel.init(resultId, testId) }

    val loadError = state.loadError
    if (loadError != null) {
        StruvaCard(modifier = Modifier.fillMaxWidth()) {
            Text("İLİŞKİ", style = EyebrowStyle)
            Spacer(Modifier.height(6.dp))
            Text(
                "İlişki bilgisi yüklenemedi: $loadError",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
            )
            TextButton(onClick = viewModel::load) { Text("Tekrar dene") }
        }
        return
    }
    if (!state.loaded) return

    StruvaCard(modifier = Modifier.fillMaxWidth()) {
        Text("İLİŞKİ", style = EyebrowStyle)
        Spacer(Modifier.height(6.dp))
        val current = state.current
        Text(
            if (current != null) {
                "Bu sonuç: ${current.label}"
            } else {
                "Bu sonuç hangi ilişkin için? Bağlarsan Harita'da görünür ve ilişkiler arası örüntüler çıkar."
            },
            style = MaterialTheme.typography.bodyMedium,
        )
        state.errorMessage?.let {
            Spacer(Modifier.height(6.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
        }
        Spacer(Modifier.height(10.dp))
        StruvaOutlinedButton(
            onClick = { showDialog = true },
            enabled = !state.saving,
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (current != null) "Değiştir" else "İlişkiye bağla") }
    }

    if (showDialog) {
        AssignDialog(
            state = state,
            onDismiss = { showDialog = false },
            onConfirm = { existingId, newLabel ->
                showDialog = false
                viewModel.assign(existingId, newLabel)
            },
        )
    }
}

@Composable
private fun AssignDialog(
    state: RelationshipAssignState,
    onDismiss: () -> Unit,
    onConfirm: (existingId: String?, newLabel: String?) -> Unit,
) {
    var selected by remember { mutableStateOf(state.current?.id ?: state.options.firstOrNull()?.id ?: NEW_OPTION) }
    var newLabel by remember { mutableStateOf("") }
    val canConfirm = selected != NEW_OPTION || newLabel.isNotBlank()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Hangi ilişki?") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                state.options.forEach { option ->
                    OptionRow(option.label, selected == option.id) { selected = option.id }
                }
                OptionRow("Yeni ilişki", selected == NEW_OPTION) { selected = NEW_OPTION }
                if (selected == NEW_OPTION) {
                    OutlinedTextField(
                        value = newLabel,
                        onValueChange = { newLabel = it.take(40) },
                        label = { Text("Ad (ör. Ayşe, Yöneticim)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                    )
                }
                if (state.current != null) {
                    TextButton(onClick = { onConfirm(null, null) }) {
                        Text("Bağı kaldır", color = StruvaColors.Bad)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (selected == NEW_OPTION) onConfirm(null, newLabel) else onConfirm(selected, null)
                },
                enabled = canConfirm,
            ) { Text("Kaydet") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Vazgeç") } },
    )
}

@Composable
private fun OptionRow(label: String, selected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RadioButton(
            selected = selected,
            onClick = onClick,
            colors = RadioButtonDefaults.colors(selectedColor = StruvaColors.Accent),
        )
        Text(label, style = MaterialTheme.typography.bodyMedium)
    }
}
