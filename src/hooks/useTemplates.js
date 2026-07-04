import { useState, useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

const defaultStandardTemplate = {
  id: "standard-cleanup-default",
  name: "Basic Clean-Up",
  isLocked: true,
  blockedPhrases: [
    "Click here to unsubscribe",
    "Manage your preferences",
    "Update your profile",
    "Privacy Policy",
    "Terms of Service",
    "California Privacy Rights",
    "All rights reserved",
    "Our mailing address is",
    "This email was sent to you because",
    "View this email in your browser",
    "Having trouble viewing this email?",
    "Follow us on Twitter",
    "Like us on Facebook",
    "Share this on LinkedIn",
    "Download our app on the App Store",
    "Get it on Google Play",
    "Forward to a friend",
    "A word from our sponsors",
    "Advertisement",
    "Was this email helpful?",
    "Rate this newsletter",
    "Salutation",
    "Greeting",
    "Job title",
    "Mailing address"
  ]
};

export function useTemplates(onTemplateChangeCb) {
  const [templates, setTemplates] = useLocalStorage("vocalize_newsletter_templates", [defaultStandardTemplate]);
  const [selectedTemplateId, setSelectedTemplateId] = useLocalStorage("vocalize_selected_template_id", "standard-cleanup-default");
  
  // Clean up initial state if needed
  useMemo(() => {
    if (!templates || templates.length === 0) {
      setTemplates([defaultStandardTemplate]);
    } else {
      let changed = false;
      const parsed = [...templates];
      const existingStandard = parsed.find(t => t.id === "standard-cleanup-default");
      if (!existingStandard) {
        parsed.unshift(defaultStandardTemplate);
        changed = true;
      } else {
        if (existingStandard.name === "Standard Clean-Up") {
          existingStandard.name = "Basic Clean-Up";
          changed = true;
        }
        defaultStandardTemplate.blockedPhrases.forEach(phrase => {
          if (!existingStandard.blockedPhrases.includes(phrase)) {
            existingStandard.blockedPhrases.push(phrase);
            changed = true;
          }
        });
      }
      if (changed) setTemplates(parsed);
    }
  }, [templates, setTemplates]);

  const activeTemplate = useMemo(() => {
    if (selectedTemplateId === "none") return null;
    return templates.find(t => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  const handleCreateTemplate = useCallback((name, clipboardText) => {
    const trimmedName = name.trim() || "Unnamed Template";
    
    const isDuplicate = templates.some(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      alert("A template with this name already exists. Please choose a different name.");
      return null;
    }

    const newId = "tpl_" + Date.now().toString();
    const newTpl = {
      id: newId,
      name: trimmedName,
      blockedPhrases: [],
      isLocked: false
    };
    
    setTemplates(prev => [...prev, newTpl]);
    setSelectedTemplateId(newId);
    return newTpl;
  }, [templates, setTemplates, setSelectedTemplateId]);

  const handleDeleteTemplate = useCallback((id) => {
    if (window.confirm("Are you sure you want to delete this newsletter template?")) {
      setTemplates(prev => {
        const updated = prev.filter(t => t.id !== id);
        return updated;
      });
      if (selectedTemplateId === id) {
        setSelectedTemplateId("none");
      }
      return true;
    }
    return false;
  }, [setTemplates, selectedTemplateId, setSelectedTemplateId]);

  const handleToggleLockTemplate = useCallback((id) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, isLocked: !t.isLocked };
      }
      return t;
    }));
  }, [setTemplates]);

  const handleRenameTemplate = useCallback((id, currentName) => {
    const newName = window.prompt("Rename Template:", currentName);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Template name cannot be empty.");
      return;
    }

    const isDuplicate = templates.some(t => t.id !== id && t.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      alert("A template with this name already exists. Please choose a different name.");
      return;
    }
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, name: trimmed };
      }
      return t;
    }));
  }, [templates, setTemplates]);

  const handleAddBlockedPhrase = useCallback((id, phrase) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl && tpl.isLocked) {
      alert("This template is locked. Please unlock it under 'Custom Filters' below to make changes.");
      return null;
    }

    const trimmed = phrase.trim();
    if (!trimmed) return null;
    
    let updatedTpl = null;
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          if (t.blockedPhrases.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
            updatedTpl = t;
            return t; 
          }
          updatedTpl = { ...t, blockedPhrases: [...t.blockedPhrases, trimmed] };
          return updatedTpl;
        }
        return t;
      });
      return updated;
    });
    
    if (onTemplateChangeCb && updatedTpl) onTemplateChangeCb(updatedTpl);
    return updatedTpl;
  }, [templates, setTemplates, onTemplateChangeCb]);

  const handleRemoveBlockedPhrase = useCallback((id, phraseToRemove) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl && tpl.isLocked) {
      alert("This template is locked. Please unlock it under 'Custom Filters' below to make changes.");
      return null;
    }

    let updatedTpl = null;
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          updatedTpl = { ...t, blockedPhrases: t.blockedPhrases.filter(p => p !== phraseToRemove) };
          return updatedTpl;
        }
        return t;
      });
      return updated;
    });
    
    if (onTemplateChangeCb && updatedTpl) onTemplateChangeCb(updatedTpl);
    return updatedTpl;
  }, [templates, setTemplates, onTemplateChangeCb]);

  const handleSelectTemplate = useCallback((id) => {
    setSelectedTemplateId(id);
    let targetTemplate = null;
    if (id !== "none") {
      targetTemplate = templates.find(t => t.id === id) || null;
    }
    if (onTemplateChangeCb) onTemplateChangeCb(targetTemplate);
  }, [templates, setSelectedTemplateId, onTemplateChangeCb]);

  return {
    templates,
    selectedTemplateId,
    activeTemplate,
    handleCreateTemplate,
    handleDeleteTemplate,
    handleToggleLockTemplate,
    handleRenameTemplate,
    handleAddBlockedPhrase,
    handleRemoveBlockedPhrase,
    handleSelectTemplate
  };
}
